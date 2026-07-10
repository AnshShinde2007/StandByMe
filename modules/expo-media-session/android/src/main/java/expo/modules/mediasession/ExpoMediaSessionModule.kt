package expo.modules.mediasession

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.util.Base64
import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class ExpoMediaSessionModule : Module() {

    private var mediaController: MediaController? = null
    private var sessionManager: MediaSessionManager? = null
    private var sessionsChangedListener: MediaSessionManager.OnActiveSessionsChangedListener? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    // ─── Callback from active MediaController ───────────────────────────────────

    private val mediaControllerCallback = object : MediaController.Callback() {
        override fun onPlaybackStateChanged(state: PlaybackState?) {
            sendMediaUpdate()
        }

        override fun onMetadataChanged(metadata: MediaMetadata?) {
            sendMediaUpdate()
        }
    }

    // ─── Module Definition ───────────────────────────────────────────────────────

    override fun definition() = ModuleDefinition {
        Name("ExpoMediaSession")

        Events("onMediaUpdate")

        OnStartObserving("onMediaUpdate") {
            val context = appContext.reactContext ?: return@OnStartObserving
            mainHandler.post { refreshActiveSession(context) }
        }

        // ── Lifecycle ───────────────────────────────────────────────────────────

        OnCreate {
            val context = appContext.reactContext ?: return@OnCreate

            sessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as? MediaSessionManager

            // Register a listener that fires whenever the set of active sessions changes
            sessionsChangedListener = MediaSessionManager.OnActiveSessionsChangedListener { controllers ->
                mainHandler.post { updateActiveSession(controllers) }
            }

            // Wire the NLS companion callback so we get notified when permission is granted
            // and the service connects
            MediaNotificationListenerService.onSessionsChangedCallback = {
                mainHandler.post { attachSessionListener(context) }
            }

            attachSessionListener(context)
            refreshActiveSession(context)
        }

        OnActivityEntersForeground {
            val context = appContext.reactContext ?: return@OnActivityEntersForeground
            // Re-check permission every time the app comes back to foreground (user may have
            // just granted access via the system settings screen)
            attachSessionListener(context)
            refreshActiveSession(context)
        }

        OnDestroy {
            mediaController?.unregisterCallback(mediaControllerCallback)
            mediaController = null

            val context = appContext.reactContext
            if (context != null) {
                try {
                    val componentName = ComponentName(context, MediaNotificationListenerService::class.java)
                    sessionsChangedListener?.let {
                        sessionManager?.removeOnActiveSessionsChangedListener(it)
                    }
                } catch (e: Exception) { /* best-effort cleanup */ }
            }

            MediaNotificationListenerService.onSessionsChangedCallback = null
        }

        // ── Playback Commands ───────────────────────────────────────────────────

        Function("play") {
            sendMediaButton(KeyEvent.KEYCODE_MEDIA_PLAY)
        }

        Function("pause") {
            sendMediaButton(KeyEvent.KEYCODE_MEDIA_PAUSE)
        }

        Function("playPause") {
            val ctrl = mediaController
            if (ctrl != null) {
                val state = ctrl.playbackState?.state
                if (state == PlaybackState.STATE_PLAYING) {
                    sendMediaButton(KeyEvent.KEYCODE_MEDIA_PAUSE)
                } else {
                    sendMediaButton(KeyEvent.KEYCODE_MEDIA_PLAY)
                }
            }
        }

        Function("next") {
            sendMediaButton(KeyEvent.KEYCODE_MEDIA_NEXT)
        }

        Function("previous") {
            sendMediaButton(KeyEvent.KEYCODE_MEDIA_PREVIOUS)
        }

        Function("seekTo") { positionSeconds: Int ->
            mediaController?.transportControls?.seekTo(positionSeconds * 1000L)
        }

        Function("setVolume") { volume: Int ->
            mediaController?.setVolumeTo(volume, 0)
        }

        // ── Permission Helpers ──────────────────────────────────────────────────

        Function("checkNotificationAccess") { ->
            val context = appContext.reactContext ?: return@Function false
            isNotificationAccessGranted(context)
        }

        Function("promptNotificationAccess") {
            val context = appContext.reactContext
            if (context != null) {
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
        }
    }

    // ─── Command Helper ────────────────────────────────────────────────────────

    private fun sendMediaButton(keyCode: Int) {
        val ctrl = mediaController ?: return
        
        // 1. Try modern transport controls first (works for most modern apps)
        try {
            when (keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY -> ctrl.transportControls.play()
                KeyEvent.KEYCODE_MEDIA_PAUSE -> ctrl.transportControls.pause()
                KeyEvent.KEYCODE_MEDIA_NEXT -> ctrl.transportControls.skipToNext()
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> ctrl.transportControls.skipToPrevious()
            }
        } catch (e: Exception) { /* ignore and fallback */ }

        // 2. Fallback to hardware key events with proper timestamps (required by some apps)
        try {
            val now = SystemClock.uptimeMillis()
            ctrl.dispatchMediaButtonEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0))
            ctrl.dispatchMediaButtonEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0))
        } catch (e: Exception) { /* ignore */ }
    }

    // ─── Session Management ──────────────────────────────────────────────────────

    /** Register the active session listener if permission is granted. */
    private fun attachSessionListener(context: Context) {
        if (!isNotificationAccessGranted(context)) return
        val componentName = ComponentName(context, MediaNotificationListenerService::class.java)
        try {
            sessionsChangedListener?.let {
                sessionManager?.removeOnActiveSessionsChangedListener(it)
                sessionManager?.addOnActiveSessionsChangedListener(it, componentName)
            }
        } catch (e: SecurityException) { /* permission not yet granted */ }
    }

    /** Query the OS for active sessions and select the best candidate. */
    private fun refreshActiveSession(context: Context) {
        if (!isNotificationAccessGranted(context)) return
        val componentName = ComponentName(context, MediaNotificationListenerService::class.java)
        try {
            val sessions = sessionManager?.getActiveSessions(componentName) ?: emptyList()
            updateActiveSession(sessions)
        } catch (e: SecurityException) { /* permission not yet granted */ }
    }

    /**
     * Select the best active media session:
     *  1. Prefer the actively PLAYING session.
     *  2. Fall back to the first session in the list (most recently used).
     */
    private fun updateActiveSession(sessions: List<MediaController>?) {
        if (sessions == null) {
            switchController(null)
            sendMediaUpdate()
            return
        }

        val best = sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING }
            ?: sessions.firstOrNull()

        switchController(best)
        sendMediaUpdate()
    }

    private fun switchController(newController: MediaController?) {
        if (mediaController === newController) return
        mediaController?.unregisterCallback(mediaControllerCallback)
        mediaController = newController
        mediaController?.registerCallback(mediaControllerCallback)
    }

    // ─── Event Emission ──────────────────────────────────────────────────────────

    private fun sendMediaUpdate() {
        val controller = mediaController

        if (controller == null) {
            // No active session — send a "no media" signal
            sendEvent("onMediaUpdate", mapOf(
                "title" to "",
                "artist" to "",
                "album" to "",
                "artwork" to null,
                "duration" to 0,
                "position" to 0,
                "isPlaying" to false,
                "packageName" to "",
                "outputDeviceType" to "Speaker",
                "outputDeviceName" to "Speaker",
                "volume" to 0,
                "maxVolume" to 0
            ))
            return
        }

        val metadata = controller.metadata ?: return
        val state = controller.playbackState

        val title    = metadata.getString(MediaMetadata.METADATA_KEY_TITLE)    ?: ""
        val artist   = metadata.getString(MediaMetadata.METADATA_KEY_ARTIST)   ?: ""
        val album    = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM)    ?: ""

        val durationMs  = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION)
        val positionMs  = state?.position ?: 0L
        val isPlaying   = state?.state == PlaybackState.STATE_PLAYING

        val playbackInfo = controller.playbackInfo
        val volume = playbackInfo?.currentVolume ?: 0
        val maxVolume = playbackInfo?.maxVolume ?: 0

        // Encode album art as a data URI if available
        val artworkUri = encodeArtwork(metadata)

        val reactContext = appContext.reactContext
        var outputDeviceTypeStr = "Speaker"
        var outputDeviceNameStr = "Speaker"
        if (reactContext != null) {
            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? android.media.AudioManager
            if (audioManager != null) {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    val devices = audioManager.getDevices(android.media.AudioManager.GET_DEVICES_OUTPUTS)
                    for (device in devices) {
                        when (device.type) {
                            android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                            android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> {
                                outputDeviceTypeStr = "Bluetooth"
                                val name = device.productName?.toString()?.trim()
                                outputDeviceNameStr = if (!name.isNullOrEmpty()) name else "Bluetooth Audio"
                                break
                            }
                            android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                            android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET -> {
                                outputDeviceTypeStr = "Wired"
                                val name = device.productName?.toString()?.trim()
                                outputDeviceNameStr = if (!name.isNullOrEmpty()) name else "Wired Headset"
                                break
                            }
                            android.media.AudioDeviceInfo.TYPE_USB_HEADSET,
                            android.media.AudioDeviceInfo.TYPE_USB_DEVICE -> {
                                outputDeviceTypeStr = "Wired"
                                val name = device.productName?.toString()?.trim()
                                outputDeviceNameStr = if (!name.isNullOrEmpty()) name else "USB Audio"
                                break
                            }
                        }
                    }
                } else {
                    @Suppress("DEPRECATION")
                    if (audioManager.isBluetoothA2dpOn) {
                        outputDeviceTypeStr = "Bluetooth"
                        outputDeviceNameStr = "Bluetooth Audio"
                    } else if (audioManager.isWiredHeadsetOn) {
                        outputDeviceTypeStr = "Wired"
                        outputDeviceNameStr = "Wired Headset"
                    }
                }
            }
        }

        sendEvent("onMediaUpdate", mapOf(
            "title"       to title,
            "artist"      to artist,
            "album"       to album,
            "artwork"     to artworkUri,
            "duration"    to (durationMs / 1000).toInt(),
            "position"    to (positionMs / 1000).toInt(),
            "isPlaying"   to isPlaying,
            "packageName" to controller.packageName,
            "outputDeviceType" to outputDeviceTypeStr,
            "outputDeviceName" to outputDeviceNameStr,
            "volume"      to volume,
            "maxVolume"   to maxVolume
        ))
    }

    // ─── Artwork ─────────────────────────────────────────────────────────────────

    /**
     * Extracts album art from MediaMetadata and returns a Base64-encoded
     * data URI string ("data:image/jpeg;base64,...") suitable for use in a
     * React Native <Image source={{ uri: artwork }} /> component.
     *
     * Returns null if no artwork is available.
     */
    private fun encodeArtwork(metadata: MediaMetadata): String? {
        val bitmap: Bitmap = try {
            metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
                ?: metadata.getBitmap(MediaMetadata.METADATA_KEY_ART)
                ?: return null
        } catch (e: Exception) {
            return null
        }

        return try {
            val stream = ByteArrayOutputStream()
            // Scale down to a reasonable size to avoid bridge overload
            val maxSize = 300
            val scaled = if (bitmap.width > maxSize || bitmap.height > maxSize) {
                val ratio = minOf(maxSize.toFloat() / bitmap.width, maxSize.toFloat() / bitmap.height)
                Bitmap.createScaledBitmap(
                    bitmap,
                    (bitmap.width * ratio).toInt(),
                    (bitmap.height * ratio).toInt(),
                    true
                )
            } else {
                bitmap
            }
            scaled.compress(Bitmap.CompressFormat.JPEG, 85, stream)
            val encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
            "data:image/jpeg;base64,$encoded"
        } catch (e: Exception) {
            null
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private fun isNotificationAccessGranted(context: Context): Boolean {
        val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            ?: return false
        return enabled.contains(context.packageName)
    }
}

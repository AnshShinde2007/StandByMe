package expo.modules.mediasession

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * A stub NotificationListenerService required by Android 5.1+ to use MediaSessionManager.
 * Active sessions can only be retrieved if a NotificationListenerService is registered
 * and the user grants Notification Access in Settings.
 *
 * We do not actually intercept notifications. We just use this component as a token.
 */
class MediaNotificationListenerService : NotificationListenerService() {

    companion object {
        var onSessionsChangedCallback: (() -> Unit)? = null
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        // Notify the module that we are now connected (permission granted)
        onSessionsChangedCallback?.invoke()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {}
    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}

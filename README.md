<div align="center">
  
# 🌟 StandBy Me
**Your Extensible, Local-First Personal Dashboard Platform**

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![Zustand](https://img.shields.io/badge/Zustand-5C3227?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

</div>

## ✨ Overview

StandBy Me is a highly polished, modular, and dynamic personal dashboard application. Built to transform any device into an interactive, glanceable hub, it offers an automatic grid layout engine and a highly extensible plugin architecture.

## 🚀 Features

- **Dynamic Grid Engine**: Beautifully laid-out dashboards with an automatic placement engine. Widgets seamlessly lock into standard sizes (`SMALL`, `MEDIUM`, `LARGE`, `WIDE`, `HERO`) and snap automatically into free space.
- **Local-First Architecture**: Your data stays with you. Built on **SQLite** and **Zustand** for lightning-fast, offline-first persistence.
- **Extensible Plugin System**: A flexible `WidgetRegistry` makes adding new widgets as simple as dropping in a React component and defining its metadata. 
- **16 Out-of-the-Box Widgets**: Includes Digital/Analog/Flip Clocks, Weather, Calendar, Sticky Notes, Pomodoro, Habit Tracker, Media Controls, GitHub & LeetCode stats, and more!
- **Dashboard Import/Export**: Easily back up or share your custom dashboard layouts and widget configurations using JSON files.
- **Theming**: A robust theme engine that supports deep customization for premium aesthetics.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnshShinde2007/StandByMe.git
   cd StandByMe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npx expo start --dev-client
   ```

## 🧩 Building Your Own Widgets

StandBy Me uses a flexible plugin architecture. Adding a widget is incredibly simple:

1. Create a standard React Native component for your widget.
2. Define the widget's metadata (Name, Description, standard Size, Category).
3. Define its `SettingDefinition` schema (text, toggles, numbers). StandBy Me automatically generates the settings UI for you!
4. Register your widget in the `WidgetRegistry`.

The grid engine automatically handles layout, drag-and-drop collision detection, rendering, and persistence!

## 📜 License
MIT License. See the `LICENSE` file for details.

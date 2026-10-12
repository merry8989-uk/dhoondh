# Dhoondh — Android app (WebView wrapper)

This is a tiny Android app that wraps the Dhoondh web app in a full-screen WebView.
It loads the live site and opens any outbound link (Google, YouTube, Archive, …) in
the device's browser.

- App id: `ai.dhoondh.app`
- minSdk 21 (Android 5.0), targetSdk 34
- No third-party libraries — plain `WebView` + framework `Activity`

## Build an APK — Android Studio (easiest)

1. Install **Android Studio** (Hedgehog or newer).
2. **File → Open** → select this `android/` folder.
3. Let Gradle sync (Studio downloads the Gradle wrapper and SDK components).
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. The debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.
   Install it on a phone (enable "Install unknown apps" for your file manager).

For a **release APK** you can share: **Build → Generate Signed App Bundle / APK**,
create a keystore, and use it. Keep the keystore file and its passwords private —
never commit them to a public repository.

## Build an APK — command line

With JDK 17 and the Android SDK installed (`ANDROID_HOME` set):

```bash
cd android
gradle wrapper            # generates the gradle wrapper (first time only)
./gradlew assembleDebug    # -> app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease  # needs a signingConfig in app/build.gradle
```

## No-code alternative: PWABuilder

Because the site is a proper PWA (manifest + service worker + icons), you can get a
**signed APK without writing any code**:

1. Go to <https://www.pwabuilder.com/>.
2. Enter `https://merry8989-uk.github.io/dhoondh/` and click **Start**.
3. Open **Android** → **Generate Package** → download the `.apk` / `.aab`.
   PWABuilder signs it for you (or lets you upload your own keystore).

This produces a Trusted Web Activity (TWA) — essentially the same thing as this
wrapper, but built and signed for you.

## Note

The app shows the **live** site, so any update pushed to the repo appears in the app
immediately — no rebuild needed. It does require an internet connection (the search
results are fetched live).

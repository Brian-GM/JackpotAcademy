package expo.modules.studycasinoblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * Listens for foreground app changes via AccessibilityService and shows
 * an overlay when they open a blocked app during an active study session.
 *
 * The user must MANUALLY enable this service in Android's Accessibility Settings —
 * we cannot grant it programmatically.
 */
class BlockerAccessibilityService : AccessibilityService() {

    private var lastBouncedAt: Long = 0L
    private var lastBouncedPkg: String = ""

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        // Ignore system UI and our own app
        if (pkg == "com.android.systemui" || pkg.startsWith("android")) return
        if (pkg == applicationContext.packageName) return
        // Ignore the overlay service
        if (pkg == "expo.modules.studycasinoblocker") return

        val active = BlocklistStore.isActive(this)
        if (!active) return

        // Check if timer has expired
        val endTime = BlocklistStore.getPomodoroEndTime(this)
        if (endTime > 0 && System.currentTimeMillis() > endTime) {
            BlocklistStore.setActive(this, false)
            BlocklistStore.clearPomodoroTimer(this)
            return
        }

        val strict = BlocklistStore.isStrictMode(this)
        val shouldBlock = if (strict) {
            // whitelist mode: only allow our app + allowlist + system
            val allow = BlocklistStore.getAllowlist(this)
            !allow.contains(pkg)
        } else {
            BlocklistStore.getBlocklist(this).contains(pkg)
        }

        if (!shouldBlock) return

        // Debounce: avoid bouncing the same app multiple times within 6s (overlay duration + buffer)
        val now = SystemClock.elapsedRealtime()
        if (pkg == lastBouncedPkg && (now - lastBouncedAt) < 6000) return
        lastBouncedPkg = pkg
        lastBouncedAt = now

        // Check if we can draw overlays
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            // Fall back to just launching our app
            launchOurApp()
            return
        }

        // Show the overlay
        showBlockedOverlay(pkg)
    }

    private fun showBlockedOverlay(blockedPkg: String) {
        val appName = try {
            val appInfo = packageManager.getApplicationInfo(blockedPkg, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (_: Exception) {
            blockedPkg
        }

        val intent = Intent(this, BlockedAppOverlayService::class.java).apply {
            putExtra(BlockedAppOverlayService.EXTRA_APP_NAME, appName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (_: Throwable) {
            // Fallback to just launching our app
            launchOurApp()
        }
    }

    private fun launchOurApp() {
        val launch = packageManager.getLaunchIntentForPackage(applicationContext.packageName)
        if (launch != null) {
            launch.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
            try {
                startActivity(launch)
                return
            } catch (_: Throwable) {
                // fall through to home
            }
        }

        // Fallback: send the user home if we cannot relaunch our app
        val home = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            startActivity(home)
        } catch (_: Throwable) {
            // best effort
        }
    }

    override fun onInterrupt() {
        // no-op
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        // Nothing extra to do — config XML already configured listening behavior.
    }
}

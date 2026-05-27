package expo.modules.studycasinoblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

/**
 * Listens for foreground app changes via AccessibilityService and bounces the user
 * back to the launcher when they open a blocked app during an active study session.
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

        val active = BlocklistStore.isActive(this)
        if (!active) return

        val strict = BlocklistStore.isStrictMode(this)
        val shouldBlock = if (strict) {
            // whitelist mode: only allow our app + allowlist + system
            val allow = BlocklistStore.getAllowlist(this)
            !allow.contains(pkg)
        } else {
            BlocklistStore.getBlocklist(this).contains(pkg)
        }

        if (!shouldBlock) return

        // Debounce: avoid bouncing the same app multiple times within 1.5s
        val now = SystemClock.elapsedRealtime()
        if (pkg == lastBouncedPkg && (now - lastBouncedAt) < 1500) return
        lastBouncedPkg = pkg
        lastBouncedAt = now

        try {
            Toast.makeText(
                this,
                "📚 Estás estudiando — vuelve a Study Casino",
                Toast.LENGTH_LONG
            ).show()
        } catch (_: Throwable) {
            // Toast can fail on some OEMs/themes — best effort.
        }

        // Launch our own app to pull the user back
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

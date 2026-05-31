package expo.modules.studycasinoblocker

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StudyCasinoBlockerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("StudyCasinoBlocker")

        Function("isAccessibilityEnabled") {
            val ctx = appContext.reactContext ?: return@Function false
            val enabled = Settings.Secure.getString(
                ctx.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return@Function false
            return@Function enabled.contains(BlockerAccessibilityService::class.java.name) ||
                enabled.contains("expo.modules.studycasinoblocker.BlockerAccessibilityService")
        }

        Function("openAccessibilitySettings") {
            val ctx = appContext.reactContext ?: return@Function Unit
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                ctx.startActivity(intent)
            } catch (_: Throwable) {
                // ignore — best effort
            }
            Unit
        }

        Function("canDrawOverlays") {
            val ctx = appContext.reactContext ?: return@Function false
            return@Function if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(ctx)
            } else {
                true
            }
        }

        Function("openOverlaySettings") {
            val ctx = appContext.reactContext ?: return@Function Unit
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${ctx.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    ctx.startActivity(intent)
                } catch (_: Throwable) {
                    // ignore — best effort
                }
            }
            Unit
        }

        Function("setBlocklist") { packages: List<String> ->
            val ctx = appContext.reactContext ?: return@Function Unit
            BlocklistStore.setBlocklist(ctx, packages)
            Unit
        }

        Function("setAllowlist") { packages: List<String> ->
            val ctx = appContext.reactContext ?: return@Function Unit
            BlocklistStore.setAllowlist(ctx, packages)
            Unit
        }

        Function("setStrictMode") { strict: Boolean ->
            val ctx = appContext.reactContext ?: return@Function Unit
            BlocklistStore.setStrictMode(ctx, strict)
            Unit
        }

        Function("setActive") { active: Boolean ->
            val ctx = appContext.reactContext ?: return@Function Unit
            BlocklistStore.setActive(ctx, active)
            Unit
        }

        Function("isActive") {
            val ctx = appContext.reactContext ?: return@Function false
            return@Function BlocklistStore.isActive(ctx)
        }

        // Start the pomodoro timer service with countdown notification
        Function("startPomodoroTimer") { durationSeconds: Int ->
            val ctx = appContext.reactContext ?: return@Function Unit
            val intent = Intent(ctx, PomodoroTimerService::class.java).apply {
                action = PomodoroTimerService.ACTION_START
                putExtra(PomodoroTimerService.EXTRA_DURATION_SECONDS, durationSeconds)
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(intent)
                } else {
                    ctx.startService(intent)
                }
            } catch (_: Throwable) {
                // best effort
            }
            Unit
        }

        // Stop the pomodoro timer service
        Function("stopPomodoroTimer") {
            val ctx = appContext.reactContext ?: return@Function Unit
            val intent = Intent(ctx, PomodoroTimerService::class.java).apply {
                action = PomodoroTimerService.ACTION_STOP
            }
            try {
                ctx.startService(intent)
            } catch (_: Throwable) {
                // best effort
            }
            Unit
        }

        // Get remaining time in seconds
        Function("getRemainingTime") {
            val ctx = appContext.reactContext ?: return@Function 0
            val endTime = BlocklistStore.getPomodoroEndTime(ctx)
            if (endTime <= 0) return@Function 0
            val remaining = ((endTime - System.currentTimeMillis()) / 1000).toInt()
            return@Function if (remaining > 0) remaining else 0
        }

        // Check if timer service is running
        Function("isTimerRunning") {
            return@Function PomodoroTimerService.isRunning()
        }

        AsyncFunction("getInstalledApps") {
            val ctx: Context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, String>>()
            val pm = ctx.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            val resolveInfos = try {
                pm.queryIntentActivities(mainIntent, 0)
            } catch (_: Throwable) {
                emptyList()
            }
            return@AsyncFunction resolveInfos.mapNotNull { info ->
                try {
                    val label = info.loadLabel(pm)?.toString() ?: return@mapNotNull null
                    val pkg = info.activityInfo.packageName
                    if (pkg == ctx.packageName) return@mapNotNull null
                    mapOf("label" to label, "package" to pkg)
                } catch (_: Throwable) {
                    null
                }
            }.sortedBy { it["label"] ?: "" }
        }
    }
}

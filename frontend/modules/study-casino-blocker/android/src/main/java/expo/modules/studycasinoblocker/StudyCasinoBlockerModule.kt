package expo.modules.studycasinoblocker

import android.content.Context
import android.content.Intent
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
            val ctx = appContext.reactContext ?: return@Function
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                ctx.startActivity(intent)
            } catch (_: Throwable) {
                // ignore — best effort
            }
        }

        Function("setBlocklist") { packages: List<String> ->
            val ctx = appContext.reactContext ?: return@Function
            BlocklistStore.setBlocklist(ctx, packages)
        }

        Function("setAllowlist") { packages: List<String> ->
            val ctx = appContext.reactContext ?: return@Function
            BlocklistStore.setAllowlist(ctx, packages)
        }

        Function("setStrictMode") { strict: Boolean ->
            val ctx = appContext.reactContext ?: return@Function
            BlocklistStore.setStrictMode(ctx, strict)
        }

        Function("setActive") { active: Boolean ->
            val ctx = appContext.reactContext ?: return@Function
            BlocklistStore.setActive(ctx, active)
        }

        Function("isActive") {
            val ctx = appContext.reactContext ?: return@Function false
            return@Function BlocklistStore.isActive(ctx)
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

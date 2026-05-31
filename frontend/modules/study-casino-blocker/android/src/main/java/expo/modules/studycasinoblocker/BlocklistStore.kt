package expo.modules.studycasinoblocker

import android.content.Context
import android.content.SharedPreferences

/**
 * Shared storage between the JS module and the AccessibilityService.
 * The service may run when the app process is dead, so we use SharedPreferences
 * (not in-memory) to keep the blocklist + active flag persistent.
 */
object BlocklistStore {
    private const val PREFS = "study_casino_blocker"
    private const val KEY_BLOCKLIST = "blocklist"
    private const val KEY_ALLOWLIST = "allowlist"
    private const val KEY_STRICT = "strict_mode"
    private const val KEY_ACTIVE = "active"
    private const val KEY_END_TIME = "pomodoro_end_time"
    private const val KEY_TOTAL_DURATION = "pomodoro_total_duration"

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun setBlocklist(ctx: Context, packages: List<String>) {
        prefs(ctx).edit().putStringSet(KEY_BLOCKLIST, packages.toSet()).apply()
    }

    fun getBlocklist(ctx: Context): Set<String> =
        prefs(ctx).getStringSet(KEY_BLOCKLIST, emptySet()) ?: emptySet()

    fun setAllowlist(ctx: Context, packages: List<String>) {
        prefs(ctx).edit().putStringSet(KEY_ALLOWLIST, packages.toSet()).apply()
    }

    fun getAllowlist(ctx: Context): Set<String> =
        prefs(ctx).getStringSet(KEY_ALLOWLIST, emptySet()) ?: emptySet()

    fun setStrictMode(ctx: Context, strict: Boolean) {
        prefs(ctx).edit().putBoolean(KEY_STRICT, strict).apply()
    }

    fun isStrictMode(ctx: Context): Boolean =
        prefs(ctx).getBoolean(KEY_STRICT, false)

    fun setActive(ctx: Context, active: Boolean) {
        prefs(ctx).edit().putBoolean(KEY_ACTIVE, active).apply()
    }

    fun isActive(ctx: Context): Boolean =
        prefs(ctx).getBoolean(KEY_ACTIVE, false)

    fun setPomodoroTimer(ctx: Context, endTimeMillis: Long, totalDurationSeconds: Int) {
        prefs(ctx).edit()
            .putLong(KEY_END_TIME, endTimeMillis)
            .putInt(KEY_TOTAL_DURATION, totalDurationSeconds)
            .apply()
    }

    fun getPomodoroEndTime(ctx: Context): Long =
        prefs(ctx).getLong(KEY_END_TIME, 0L)

    fun getTotalDuration(ctx: Context): Int =
        prefs(ctx).getInt(KEY_TOTAL_DURATION, 25 * 60)

    fun clearPomodoroTimer(ctx: Context) {
        prefs(ctx).edit()
            .remove(KEY_END_TIME)
            .remove(KEY_TOTAL_DURATION)
            .apply()
    }
}

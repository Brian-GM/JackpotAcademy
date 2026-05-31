package expo.modules.studycasinoblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Foreground Service that keeps the pomodoro timer running in the background
 * and updates the notification with the countdown.
 */
class PomodoroTimerService : Service() {

    companion object {
        const val CHANNEL_ID = "pomodoro_timer_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "START_TIMER"
        const val ACTION_STOP = "STOP_TIMER"
        const val ACTION_UPDATE = "UPDATE_TIMER"
        const val EXTRA_DURATION_SECONDS = "duration_seconds"

        private var instance: PomodoroTimerService? = null
        
        fun isRunning(): Boolean = instance != null
    }

    private val handler = Handler(Looper.getMainLooper())
    private var wakeLock: PowerManager.WakeLock? = null
    private var endTimeMillis: Long = 0L
    private var totalDurationSeconds: Int = 0

    private val tickRunnable = object : Runnable {
        override fun run() {
            val remaining = ((endTimeMillis - System.currentTimeMillis()) / 1000).toInt()
            if (remaining <= 0) {
                // Timer finished
                BlocklistStore.setActive(this@PomodoroTimerService, false)
                BlocklistStore.clearPomodoroTimer(this@PomodoroTimerService)
                stopSelf()
                return
            }
            updateNotification(remaining)
            handler.postDelayed(this, 1000)
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                totalDurationSeconds = intent.getIntExtra(EXTRA_DURATION_SECONDS, 25 * 60)
                endTimeMillis = System.currentTimeMillis() + (totalDurationSeconds * 1000L)
                BlocklistStore.setPomodoroTimer(this, endTimeMillis, totalDurationSeconds)
                BlocklistStore.setActive(this, true)
                startForeground(NOTIFICATION_ID, createNotification(totalDurationSeconds))
                handler.post(tickRunnable)
            }
            ACTION_UPDATE -> {
                // Restore timer state from preferences
                endTimeMillis = BlocklistStore.getPomodoroEndTime(this)
                totalDurationSeconds = BlocklistStore.getTotalDuration(this)
                if (endTimeMillis > System.currentTimeMillis()) {
                    val remaining = ((endTimeMillis - System.currentTimeMillis()) / 1000).toInt()
                    startForeground(NOTIFICATION_ID, createNotification(remaining))
                    handler.post(tickRunnable)
                } else {
                    stopSelf()
                }
            }
            ACTION_STOP -> {
                BlocklistStore.setActive(this, false)
                BlocklistStore.clearPomodoroTimer(this)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Pomodoro Timer",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Muestra el tiempo restante del pomodoro"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(remainingSeconds: Int): Notification {
        val minutes = remainingSeconds / 60
        val seconds = remainingSeconds % 60
        val timeText = String.format("%02d:%02d restantes", minutes, seconds)

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, PomodoroTimerService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🍅 Pomodoro Activo")
            .setContentText(timeText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Detener", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .build()
    }

    private fun updateNotification(remainingSeconds: Int) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, createNotification(remainingSeconds))
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "StudyCasino:PomodoroWakeLock"
        ).apply {
            acquire(60 * 60 * 1000L) // 1 hour max
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }
}

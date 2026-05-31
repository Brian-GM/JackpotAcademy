package expo.modules.studycasinoblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

/**
 * Shows an overlay when a blocked app is detected.
 * Displays a countdown and then returns the user to our app.
 */
class BlockedAppOverlayService : Service() {

    companion object {
        const val EXTRA_APP_NAME = "app_name"
        const val COUNTDOWN_SECONDS = 5
        const val NOTIFICATION_ID = 2002
        const val CHANNEL_ID = "blocked_overlay_channel"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val handler = Handler(Looper.getMainLooper())
    private var countdown = COUNTDOWN_SECONDS

    private val countdownRunnable = object : Runnable {
        override fun run() {
            countdown--
            updateCountdownText()
            if (countdown <= 0) {
                returnToApp()
            } else {
                handler.postDelayed(this, 1000)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start as foreground service to prevent being killed
        startForeground(NOTIFICATION_ID, createNotification())
        
        val appName = intent?.getStringExtra(EXTRA_APP_NAME) ?: "esta aplicación"
        countdown = COUNTDOWN_SECONDS
        showOverlay(appName)
        handler.removeCallbacks(countdownRunnable)
        handler.postDelayed(countdownRunnable, 1000)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(countdownRunnable)
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Blocker Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when a blocked app is detected"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⚠️ App bloqueada detectada")
            .setContentText("Volviendo a Study Casino...")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun showOverlay(appName: String) {
        // Remove any existing overlay first
        removeOverlay()
        
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            // FLAG_NOT_FOCUSABLE removed to allow button clicks
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        overlayView = createOverlayView(appName)
        try {
            windowManager?.addView(overlayView, layoutParams)
        } catch (e: Exception) {
            // Permission might not be granted
            returnToApp()
        }
    }

    private fun createOverlayView(appName: String): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#F5000000"))
            setPadding(80, 80, 80, 80)
        }

        val warningIcon = TextView(this).apply {
            text = "🎰"
            textSize = 80f
            gravity = Gravity.CENTER
        }

        val title = TextView(this).apply {
            text = "¡APLICACIÓN PROHIBIDA!"
            textSize = 28f
            setTextColor(Color.parseColor("#FF5252"))
            gravity = Gravity.CENTER
            setPadding(0, 40, 0, 20)
            paint.isFakeBoldText = true
        }

        val message = TextView(this).apply {
            text = "Estás intentando usar\n\"$appName\"\ndurante tu sesión de estudio."
            textSize = 18f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 10, 0, 50)
        }

        val countdownText = TextView(this).apply {
            tag = "countdown"
            text = "Cerrando en ${countdown}..."
            textSize = 24f
            setTextColor(Color.parseColor("#FFC107"))
            gravity = Gravity.CENTER
            paint.isFakeBoldText = true
        }

        // Botón para cerrar inmediatamente sin esperar
        val closeButton = TextView(this).apply {
            text = "CERRAR AHORA"
            textSize = 18f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(60, 30, 60, 30)
            setBackgroundColor(Color.parseColor("#D32F2F"))
            paint.isFakeBoldText = true
            setOnClickListener {
                returnToApp()
            }
        }

        val subText = TextView(this).apply {
            text = "¡Vuelve a estudiar! 📚"
            textSize = 16f
            setTextColor(Color.parseColor("#AAAAAA"))
            gravity = Gravity.CENTER
            setPadding(0, 30, 0, 0)
        }

        layout.addView(warningIcon)
        layout.addView(title)
        layout.addView(message)
        layout.addView(countdownText)
        layout.addView(closeButton)
        layout.addView(subText)

        return layout
    }

    private fun updateCountdownText() {
        val countdownView = overlayView?.findViewWithTag<TextView>("countdown")
        countdownView?.text = "Cerrando en ${countdown}..."
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (_: Exception) {}
        }
        overlayView = null
    }

    private fun returnToApp() {
        removeOverlay()
        
        // Launch our app
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        if (launch != null) {
            launch.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
            try {
                startActivity(launch)
            } catch (_: Throwable) {}
        }
        
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }
}

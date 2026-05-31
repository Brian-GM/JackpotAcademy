package expo.modules.studycasinoblocker

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

/**
 * Shows an overlay when a blocked app is detected.
 * Displays a countdown and then returns the user to our app.
 */
class BlockedAppOverlayService : Service() {

    companion object {
        const val EXTRA_APP_NAME = "app_name"
        const val COUNTDOWN_SECONDS = 5
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
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val appName = intent?.getStringExtra(EXTRA_APP_NAME) ?: "esta aplicación"
        showOverlay(appName)
        handler.postDelayed(countdownRunnable, 1000)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(countdownRunnable)
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun showOverlay(appName: String) {
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
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
            stopSelf()
        }
    }

    private fun createOverlayView(appName: String): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#E6000000"))
            setPadding(60, 60, 60, 60)
        }

        val warningIcon = TextView(this).apply {
            text = "⚠️"
            textSize = 72f
            gravity = Gravity.CENTER
        }

        val title = TextView(this).apply {
            text = "¡APLICACIÓN PROHIBIDA!"
            textSize = 28f
            setTextColor(Color.parseColor("#FF5252"))
            gravity = Gravity.CENTER
            setPadding(0, 30, 0, 20)
        }

        val message = TextView(this).apply {
            text = "Estás intentando usar $appName\ndurante tu sesión de estudio."
            textSize = 18f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 40)
        }

        val countdownText = TextView(this).apply {
            tag = "countdown"
            text = "Volviendo a Study Casino en ${countdown}s..."
            textSize = 20f
            setTextColor(Color.parseColor("#FFC107"))
            gravity = Gravity.CENTER
        }

        layout.addView(warningIcon)
        layout.addView(title)
        layout.addView(message)
        layout.addView(countdownText)

        return layout
    }

    private fun updateCountdownText() {
        val countdownView = overlayView?.findViewWithTag<TextView>("countdown")
        countdownView?.text = "Volviendo a Study Casino en ${countdown}s..."
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
        
        stopSelf()
    }
}

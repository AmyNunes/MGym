package expo.modules.restcountdown

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Contagem regressiva do descanso na notificação (seção 2.2), com o cronômetro do Android:
 * o próprio sistema atualiza os segundos, sem o app acordar. A notificação é silenciosa
 * (o aviso com som é a do fim do descanso, agendada pelo expo-notifications) e some sozinha
 * quando o tempo acaba.
 */
class RestCountdownModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Sem contexto do app" }

  override fun definition() = ModuleDefinition {
    Name("RestCountdown")

    Function("show") { endsAtMs: Double, title: String, body: String, channelName: String ->
      show(endsAtMs.toLong(), title, body, channelName)
    }

    Function("hide") {
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }
  }

  private fun show(endsAt: Long, title: String, body: String, channelName: String) {
    val ctx = context
    val remaining = endsAt - System.currentTimeMillis()
    if (remaining <= 0) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    ensureChannel(ctx, channelName)

    val open = Intent(Intent.ACTION_VIEW, Uri.parse(DEEP_LINK))
      .setPackage(ctx.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val pending = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val icon = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
      .takeIf { it != 0 } ?: ctx.applicationInfo.icon

    val builder = NotificationCompat.Builder(ctx, CHANNEL_ID)
      .setSmallIcon(icon)
      .setContentTitle(title)
      .setContentText(body)
      .setContentIntent(pending)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(true)
      .setWhen(endsAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setTimeoutAfter(remaining)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    val colorId = ctx.resources.getIdentifier("notification_icon_color", "color", ctx.packageName)
    if (colorId != 0) builder.color = ContextCompat.getColor(ctx, colorId)

    try {
      NotificationManagerCompat.from(ctx).notify(NOTIFICATION_ID, builder.build())
    } catch (_: SecurityException) {
      // Sem permissão: o descanso continua na tela e a notificação do fim continua agendada.
    }
  }

  private fun ensureChannel(ctx: Context, name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW).apply {
      setShowBadge(false)
      enableVibration(false)
      setSound(null, null)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    ctx.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
  }

  companion object {
    private const val CHANNEL_ID = "rest_countdown"
    private const val NOTIFICATION_ID = 7301
    private const val DEEP_LINK = "mgym://session/current"
  }
}

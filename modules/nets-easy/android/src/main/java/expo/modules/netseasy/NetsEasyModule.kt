package expo.modules.netseasy

import android.app.AlertDialog
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Option A - native Nets Easy SDK bridge, as an Expo module.
//
// presentCheckout(paymentId) presents the native checkout and resolves with a
// terminal status - the React Native equivalent of the Flutter MethodChannel
// se.malsom/host.base. In production the body launches the real Nets Easy
// Android SDK Activity (Nets-Easy-Android-SDK) and resolves on its result; here
// a native dialog flow stands in so the module compiles and runs without a
// merchant account.
class NetsEasyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NetsEasy")

    AsyncFunction("presentCheckout") { paymentId: String, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("no_activity", "No current activity", null)
        return@AsyncFunction
      }
      activity.runOnUiThread {
        // Real SDK integration would launch NetsCheckoutActivity for paymentId
        // and resolve in the activity-result callback. The SDK owns the card
        // form, Google Pay sheet, and the 3DS2 / BankID app-switch + return.
        AlertDialog.Builder(activity)
          .setTitle("Nets Easy SDK")
          .setMessage("Payment $paymentId\n\n3-D Secure: verify with BankID to approve.")
          .setPositiveButton("Open BankID") { _, _ ->
            promise.resolve(mapOf("status" to "paid", "paymentId" to paymentId))
          }
          .setNegativeButton("Cancel") { _, _ ->
            promise.resolve(mapOf("status" to "cancelled", "paymentId" to paymentId))
          }
          .setCancelable(false)
          .show()
      }
    }
  }
}

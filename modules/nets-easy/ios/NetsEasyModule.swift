import ExpoModulesCore
import UIKit

// Option A - native Nets Easy SDK bridge, as an Expo module.
//
// presentCheckout(paymentId) presents the native checkout and resolves with a
// terminal status. This is the React Native equivalent of the existing Flutter
// MethodChannel se.malsom/host.base. In production the body presents the real
// Nets Easy iOS SDK view controller (Nets-Easy-iOS-SDK) and resolves on its
// delegate callback; here a self-contained native checkout VC stands in so the
// module compiles and runs without a merchant account.
public class NetsEasyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NetsEasy")

    AsyncFunction("presentCheckout") { (paymentId: String, promise: Promise) in
      DispatchQueue.main.async {
        guard let presenter = Self.topViewController() else {
          promise.reject("no_presenter", "No view controller to present from")
          return
        }

        // Real SDK integration would be:
        //
        //   let config = NetsCheckoutConfiguration(paymentId: paymentId, environment: .test)
        //   let vc = NetsCheckoutViewController(configuration: config)
        //   vc.completion = { result in promise.resolve(["status": result.status, "paymentId": paymentId]) }
        //
        // The SDK owns the card form, Apple Pay sheet, and the 3DS2 / BankID
        // app-switch + return. No WebView is involved in this path.
        let vc = NetsCheckoutViewController(paymentId: paymentId) { status in
          promise.resolve(["status": status, "paymentId": paymentId])
        }
        vc.modalPresentationStyle = .formSheet
        presenter.present(vc, animated: true)
      }
    }
  }

  private static func topViewController() -> UIViewController? {
    let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
    var top = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}

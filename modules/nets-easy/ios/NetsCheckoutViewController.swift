import UIKit

// Self-contained native checkout screen standing in for the Nets Easy iOS SDK's
// own UI, so Option A runs end to end in a dev build with no merchant account.
// It mimics the SDK contract: present, drive a 3DS2 / BankID step natively, and
// invoke a completion with a terminal status. Swap this VC for the real
// NetsCheckoutViewController to go live.
final class NetsCheckoutViewController: UIViewController {
  private let paymentId: String
  private let completion: (String) -> Void
  private let stack = UIStackView()

  init(paymentId: String, completion: @escaping (String) -> Void) {
    self.paymentId = paymentId
    self.completion = completion
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground
    stack.axis = .vertical
    stack.spacing = 14
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
      stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
      stack.centerYAnchor.constraint(equalTo: view.centerYAnchor)
    ])
    showCard()
  }

  private func clear() { stack.arrangedSubviews.forEach { $0.removeFromSuperview() } }

  private func label(_ text: String, size: CGFloat, weight: UIFont.Weight) -> UILabel {
    let l = UILabel()
    l.text = text
    l.font = .systemFont(ofSize: size, weight: weight)
    l.numberOfLines = 0
    l.textAlignment = .center
    return l
  }

  private func button(_ title: String, color: UIColor, action: Selector) -> UIButton {
    let b = UIButton(type: .system)
    b.setTitle(title, for: .normal)
    b.setTitleColor(.white, for: .normal)
    b.backgroundColor = color
    b.titleLabel?.font = .systemFont(ofSize: 16, weight: .semibold)
    b.layer.cornerRadius = 12
    b.heightAnchor.constraint(equalToConstant: 50).isActive = true
    b.addTarget(self, action: action, for: .touchUpInside)
    return b
  }

  private func showCard() {
    clear()
    stack.addArrangedSubview(label("Nets Easy SDK", size: 22, weight: .bold))
    stack.addArrangedSubview(label("Payment \(paymentId)", size: 13, weight: .regular))
    stack.addArrangedSubview(button("Pay with card", color: UIColor(red: 0.13, green: 0.35, blue: 0.44, alpha: 1), action: #selector(toChallenge)))
  }

  @objc private func toChallenge() {
    clear()
    stack.addArrangedSubview(label("3-D Secure", size: 20, weight: .bold))
    stack.addArrangedSubview(label("Verify with BankID to approve this payment.", size: 14, weight: .regular))
    stack.addArrangedSubview(button("Open BankID", color: UIColor(red: 0.13, green: 0.35, blue: 0.44, alpha: 1), action: #selector(approve)))
    stack.addArrangedSubview(button("Cancel", color: .systemGray, action: #selector(cancel)))
  }

  @objc private func approve() { finish("paid") }
  @objc private func cancel() { finish("cancelled") }

  private func finish(_ status: String) {
    dismiss(animated: true) { [completion] in completion(status) }
  }
}

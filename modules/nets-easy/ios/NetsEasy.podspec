Pod::Spec.new do |s|
  s.name           = 'NetsEasy'
  s.version        = '1.0.0'
  s.summary        = 'React Native bridge for the native Nets Easy (Nets/DIBS) SDK'
  s.description    = 'Presents the native Nets Easy checkout and resolves with a terminal status.'
  s.author         = 'phungnlg'
  s.homepage       = 'https://github.com/phungnlg/expo-nets-dibs-checkout-demo'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Real integration adds the Nets Easy iOS SDK here, e.g.:
  # s.dependency 'NetsEasy'   # github.com/Nets-eCom/Nets-Easy-iOS-SDK

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

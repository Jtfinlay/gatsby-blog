---
title: Webview navigation timeout
date: "2021-02-04"
template: "post"
draft: false
slug: "csharp-xaml-webview-navigate-timeout"
category: "Front end"
tags:
  - "Xaml"
  - "C#"
description: "This is a quick post on a problem I recently hit working on a C# XAML application. When using a Webview to navigate to a website, there is no default retry, timeout, or time tracking attributes available with XAML. Users could hit timeouts of over a minute, and there is no built in tracking to handle these cases."
---

*First written Oct '17. It's seen some traffic and was poorly written, so I've made updates.*

This is a quick post on a problem I recently hit working on a C# XAML application. When using a Webview to navigate to a website, there is no default retry, timeout, or time tracking attributes available with XAML. Users could hit timeouts of over a minute, and there is no built in tracking to handle these cases.

In this post we’ll look at a designing a solution for providing timing.

## 👉 Solution

In our solution, there are three key items we are looking for:

1. ⌚ After x of time, the navigation has **timed out** and should be cancelled.
2. 💥 After 3 failures  perform an action, from either timeout or other 5xx issues.
3. 👁‍🗨 Include logging/telemetry around total elapsed time 

Complete code for this guide is available on **[github](https://github.com/Jtfinlay/webview-navigate-sample)**.

```csharp
namespace WebviewNavigateTest
{
    public class WebviewNavigator
    {
        /// <summary>
        /// The maximum number of attempts to try a navigation.
        /// </summary>
        private const int MAX_RETRY_COUNT = 3;

        /// <summary>
        /// The maximum time allowed to perform a navigation.
        /// </summary>
        private const int MAX_TIMEOUT_MS = 1000;

        /// <summary>
        /// Access to the wrapped webview instance
        /// </summary>
        private readonly WebView _webView;

        private readonly Stopwatch _stopwatch = new Stopwatch();

        private readonly DispatcherTimer _countdownTimer = new DispatcherTimer()
        {
            Interval = new TimeSpan(0, 0, 0, 0, MAX_TIMEOUT_MS)
        };

        /// <summary>
        /// Keep track of the desired navigation.
        /// </summary>
        private Action _navigationAction;

        /// <summary>
        /// Number of navigation attempts
        /// </summary>
        private int _navigationAttempt = 1;

        public event TypedEventHandler<WebView, WebViewNavigationSuccessArgs> NavigationCompleted;

        public WebviewNavigator(WebView webView)
        {
            _webView = webView;
            _webView.NavigationCompleted += OnNavigationCompleted;

            _countdownTimer.Tick += OnTimeoutElapsed;
        }

        public void Navigate(Uri source)
        {
            _navigationAction = () => _webView.Navigate(source);
            _navigationAttempt = 1;

            Navigate();
        }

        public void NavigateWithHttpRequestMessage(HttpRequestMessage requestMessage)
        {
            _navigationAction = () => _webView.NavigateWithHttpRequestMessage(requestMessage);
            _navigationAttempt = 1;

            Navigate();
        }

        private void OnTimeoutElapsed(object sender, object e)
        {
            _webView.Stop();

            _stopwatch.Stop();
            _countdownTimer.Stop();

            _navigationAttempt++;
            if (_navigationAttempt > MAX_RETRY_COUNT)
            {
                NavigationCompleted?.Invoke(_webView, new WebViewNavigationSuccessArgs(false, null, Windows.Web.WebErrorStatus.Timeout));
                return;
            }

            Navigate();
        }

        private void Navigate()
        {
            _stopwatch.Restart();
            _countdownTimer.Start();

            _navigationAction.Invoke();
        }

        private void OnNavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
        {
            _stopwatch.Stop();
            _countdownTimer.Stop();

            if (args.IsSuccess)
            {
                NavigationCompleted?.Invoke(sender, new WebViewNavigationSuccessArgs(args));
                return;
            }

            _navigationAttempt++;
            if (_navigationAttempt > MAX_RETRY_COUNT)
            {
                NavigationCompleted?.Invoke(sender, new WebViewNavigationSuccessArgs(args));
                return;
            }

            Navigate();
        }
    }
}
```

The **StopWatch** ([msdn](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.stopwatch?redirectedfrom=MSDN&view=net-5.0)) is used for tracking the total amount of time in a request, and is used for *logging/telemetry*.

The **DispatchTimer** ([msdn](https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.dispatchertimer?view=winrt-19041)) triggers after a set time interval, and is used to identify a *time out*.

## Improvements

An improvement that was not covered it to implement a `CancelNavigation` to be called when a fresh Navigation is invoked, in case there are any ongoing network calls.
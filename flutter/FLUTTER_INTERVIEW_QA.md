# Flutter Interview Q&A (3–4 sentences each)

Concise answers for interview prep and real-world discussion. Place this file in your Flutter project’s `docs/` (or repo root) as you prefer.

---

## Basic

**1. What is Flutter?**  
Flutter is Google’s open-source UI toolkit for building natively compiled apps from one codebase for mobile, web, and desktop. You write UI in Dart; the Flutter engine paints pixels using Skia (or Impeller on supported platforms) instead of wrapping OEM widgets. It emphasizes fast iteration (hot reload), a rich widget catalog, and consistent visuals across platforms.

**2. Difference between Flutter and native development?**  
Native apps use each platform’s UI toolkit (UIKit, Jetpack Compose, etc.) and languages (Swift/Kotlin), giving maximum platform integration but separate codebases. Flutter draws its own UI and uses platform channels only where needed, so one Dart codebase targets many platforms with fewer UI forks. Trade-offs: native can feel more “at home” for deep OS integrations; Flutter wins on velocity and UI consistency when that fits the product.

**3. What is a widget?**  
In Flutter, almost everything in the UI is a widget: a description of part of the interface and how it should look or behave given configuration. Widgets are immutable configuration objects; Flutter compares new widgets to old ones to update the underlying elements and render objects. Layout, styling, gestures, and state hooks are all expressed through the widget tree.

**4. StatelessWidget vs StatefulWidget?**  
`StatelessWidget` has no mutable state tied to the widget instance; when parent data changes, Flutter rebuilds it from new inputs. `StatefulWidget` splits into an immutable widget and a mutable `State` object that can call `setState` to trigger rebuilds. Use stateless when output depends only on constructor arguments; use stateful when you need ephemeral UI state, controllers, or lifecycle hooks.

**5. What is `build()` method?**  
`build()` returns the widget subtree that describes the current UI for this widget given its configuration and (for `State`) current state. The framework may call `build()` often; it must be pure, fast, and free of side effects beyond describing UI. Heavy work belongs in async services, not directly inside `build()`.

**6. What is `BuildContext`?**  
`BuildContext` is a handle to a widget’s location in the element tree; it lets you look up inherited data (`Theme`, `MediaQuery`), register for dependencies, and obtain things like `Navigator` or `Scaffold`. It is valid only for the mounted subtree—do not use it after async gaps without checking `mounted`. Treat it as the bridge between your widget and the framework’s services above you.

**7. What is `MaterialApp`?**  
`MaterialApp` is a convenience app shell that wires routing, theming, localization, and Material Design defaults (including `Navigator` and `ScaffoldMessenger`). It sets up the root widget tree most Material-style apps need in one place. For Cupertino-only UIs you might use `CupertinoApp` instead, but the same ideas apply.

**8. What is `Scaffold`?**  
`Scaffold` implements the basic Material page structure: `appBar`, `body`, `floatingActionButton`, drawers, bottom sheets, and snackbars via `ScaffoldMessenger`. It handles safe insets and many Material layout conventions. It is not mandatory—you can compose raw `Column`s—but it saves boilerplate for standard screens.

**9. What are layouts in Flutter?**  
Layouts are widgets (`Row`, `Column`, `Stack`, `Flex`, `Wrap`, etc.) that position and size children according to constraints passed down from parents. Flutter’s layout is constraint-driven: parent proposes constraints, child chooses a size, parent positions the child. Understanding constraints is the key to fixing “overflow” and unexpected sizing.

**10. Row vs Column?**  
`Row` lays out children horizontally along the main axis (left–right in LTR); `Column` lays them out vertically. Both are `Flex` widgets: you control spacing with `MainAxisAlignment`, `CrossAxisAlignment`, and `mainAxisSize`. Pick `Row` for horizontal lists of widgets and `Column` for vertical stacks.

**11. Expanded vs Flexible?**  
Both are used inside `Flex` (`Row`/`Column`) to participate in flexible space distribution. `Expanded` forces the child to fill remaining space along the main axis (equivalent to `Flexible` with `fit: FlexFit.tight`). `Flexible` lets the child be smaller than the offered space when `fit` is `loose`, which is useful for wrapping or intrinsic-sized children.

**12. What is `setState()`?**  
`setState` schedules a rebuild of the `State` object’s widget subtree after synchronously updating fields you mark as changed. It is the simplest way to drive ephemeral UI state in `StatefulWidget`. For large or shared state, prefer `ValueNotifier`, `Provider`, Riverpod, BLoC, etc., instead of scattering `setState` everywhere.

**13. Hot Reload vs Hot Restart?**  
Hot reload injects updated Dart code into the running VM and rebuilds widgets, preserving app state where possible—ideal for UI tweaks. Hot restart restarts the isolate and reruns `main()`, resetting state but still faster than a full rebuild. Some changes (native code, `main`, enums used in switches, global initializers) require a full restart or rebuild.

**14. What is pubspec.yaml?**  
It declares your package name, SDK constraints, dependencies, dev_dependencies, assets, and Flutter-specific settings (fonts, platforms). Pub uses it to resolve versions and build the app. Keeping version constraints intentional avoids surprise breakages across `flutter pub get`.

**15. What are assets in Flutter?**  
Assets are bundled files (images, fonts, JSON, Lottie, etc.) shipped inside the app binary, listed under `flutter: assets:` in `pubspec.yaml`. They are loaded asynchronously via `rootBundle` or `Image.asset`. Correct paths and declaring every file or directory matters or runtime load fails.

**16. What is Navigator?**  
`Navigator` manages a stack of routes (pages); `push` adds a route, `pop` removes it, enabling back navigation. It is typically obtained via `Navigator.of(context)` from a `MaterialApp`/`CupertinoApp`. For complex flows, Navigator 2.0 / `go_router` express URLs and deep links more explicitly.

**17. push vs pushReplacement?**  
`push` stacks a new route on top so the user can pop back to the previous screen. `pushReplacement` removes the current route and replaces it with the new one, so back skips the replaced screen—common after login success. Choose based on whether the prior screen should remain in history.

**18. What is a ListView?**  
`ListView` is a scrollable column of children; it lazily builds off-screen children when using constructors like `builder`. It integrates with slivers under the hood for scrolling physics and overscroll. For few fixed children, `ListView` with a `children:` list is fine; for many items, prefer `ListView.builder`.

**19. ListView.builder vs ListView?**  
`ListView` with `children:` builds all children up front, which is expensive for long lists. `ListView.builder` (and `separated`) creates only items near the viewport, recycling elements for performance. Always prefer `builder` for dynamic or large datasets.

**20. What is SafeArea?**  
`SafeArea` pads its child so it avoids notches, status bars, home indicators, and display cutouts using `MediaQuery` padding. It prevents important UI from being obscured on modern phones. You can selectively disable sides with `minimum` or `only` parameters.

**21. What is MediaQuery?**  
`MediaQuery` exposes screen size, device pixel ratio, padding, view insets (keyboard), text scaling, and platform brightness from the nearest `MediaQuery` widget—usually above `MaterialApp`. Widgets call `MediaQuery.of(context)` to adapt layout responsively. It updates when orientation, split-screen, or keyboard changes.

**22. What is ThemeData?**  
`ThemeData` centralizes colors, typography, shapes, and component themes (`AppBarTheme`, `CardTheme`, etc.) for a consistent look. `Theme.of(context)` reads the nearest theme, supporting light/dark `ThemeMode`. Centralizing design tokens here avoids hard-coded colors scattered through widgets.

**23. What is GestureDetector?**  
`GestureDetector` listens for pointer gestures (tap, long press, drag, scale) on its non-visual hit target. It participates in the gesture arena and is flexible but does not show Material ink splash by itself. Use it when you need generic gesture handling without Material ripple.

**24. What is InkWell?**  
`InkWell` is a Material widget that shows splash and highlight effects on taps, and must typically be inside a `Material` (or `Material` ancestor) so the ink can paint. It combines hit testing and Material feedback. Prefer `InkWell` for tappable list tiles and buttons matching Material design.

**25. Padding vs margin?**  
In Flutter, “margin” is usually modeled as outer padding around a child using `Padding` or `Container`’s `margin` (which wraps a `DecoratedBox` and extra `Padding`). “Padding” is space inside the parent’s decoration before the child. `Container` lets you set both; under the hood it composes `Padding`, `DecoratedBox`, and constraints.

---

## Intermediate

**26. How does Flutter render UI internally?**  
Widgets describe configuration; elements mount widgets to the tree and reconcile updates; render objects layout and paint. The engine composites layers and sends GPU commands (Skia/Impeller). Each frame, dirty regions are repainted after layout and compositing passes.

**27. Widget tree vs element tree vs render tree?**  
The widget tree is immutable descriptions rebuilt frequently. The element tree is the stable, mounted structure tying widgets to their `State` and `RenderObject`. The render tree performs layout, hit testing, and painting—usually a smaller, long-lived structure updated incrementally.

**28. What are keys in Flutter?**  
Keys identify widgets across rebuilds so Flutter can match, reorder, or preserve state correctly when sibling lists change. Without keys, Flutter matches by type and position, which can mis-associate `State` after reordering. Keys do not affect equality of widget configuration—only element reuse.

**29. GlobalKey vs ValueKey vs UniqueKey?**  
`ValueKey` identifies a widget by a stable value (e.g., id). `ObjectKey` uses identity; `UniqueKey` forces a fresh element each build—use sparingly. `GlobalKey` is unique app-wide, allows accessing `State` or `RenderObject` from anywhere, and is heavier for the framework.

**30. When should you use keys?**  
Use keys when reordering, removing, or inserting widgets in a list where state must follow the correct item, or when form fields would otherwise keep wrong controllers. Animated lists and `StatefulWidget`s inside `Row`/`Column` that shuffle benefit from `ValueKey` on model ids. Avoid keys everywhere by default—only when identity-by-position is wrong.

**31. What is InheritedWidget?**  
`InheritedWidget` efficiently propagates data down the tree; dependents call `dependOnInheritedWidgetOfExactType` to rebuild when the inherited value changes. `Theme`, `MediaQuery`, and `DefaultTextStyle` are examples. Provider builds on this mechanism under the hood.

**32. How does state propagate in Flutter?**  
State flows down as constructor arguments and `InheritedWidget`/`Provider` data; callbacks and events flow up. `setState` or notifier updates mark dependents dirty for rebuild. Architectural patterns (BLoC, Riverpod) formalize how far and how async updates propagate.

**33. What is context.watch / read (Provider)?**  
`context.watch` subscribes the widget to a provider and rebuilds when the value changes. `context.read` fetches once without subscribing—use inside callbacks, not in `build`, to avoid missing updates. `select` narrows rebuilds to parts of a model for performance.

**34. Lifecycle of StatefulWidget?**  
The framework creates the `State` object, inserts the element, calls `initState`, then `didChangeDependencies`, then `build`. When dependencies or parent widget config change, `didUpdateWidget` runs; when removed, `deactivate` then `dispose`. Async work started in `initState` must be cancelled in `dispose`.

**35. initState vs didChangeDependencies?**  
`initState` runs once when `State` is first created—use for one-time setup, controllers, and listeners not needing inherited widgets. `didChangeDependencies` runs after `initState` and whenever an `InheritedWidget` dependency changes—good for things that need `Theme`/`MediaQuery`/`Route` after context is fully wired. Avoid heavy work in both; keep them light.

**36. dispose() usage?**  
`dispose` runs when the `State` object is permanently removed—release `AnimationController`s, `TextEditingController`s, streams subscriptions, and timers here. Failing to dispose causes leaks and callbacks after unmount. Always check `mounted` before `setState` after async gaps.

**37. What causes widget rebuilds?**  
Parent rebuilds, `setState`, `InheritedWidget` notifications, `Listenable`/`ChangeNotifier` listeners, provider updates, animations, and route changes. The framework marks elements dirty and schedules a frame. Excessive rebuilds often come from overly broad `context.watch` or rebuilding high ancestors unnecessarily.

**38. How to avoid unnecessary rebuilds?**  
Split widgets so only subtrees that need data rebuild; use `const` constructors, `RepaintBoundary`, granular `Selector`/`select` in Riverpod/Provider, and `ValueListenableBuilder` for small slices. Memoize expensive children with keys and stable models. Profile with DevTools “Rebuild stats” to find hotspots.

**39. Const constructor benefit?**  
`const` widgets are canonicalized at compile time and short-circuit rebuild diffing when parent rebuilds but child configuration is identical. This reduces allocations and element work. Use `const` wherever all fields are compile-time constants.

**40. What is RepaintBoundary?**  
It inserts a separate layer so repaints inside the boundary do not repaint siblings, and can improve performance for complex static regions. It can also enable screenshotting a subtree. Overuse increases layer count and memory—profile before blanket wrapping.

**41. What is LayoutBuilder?**  
`LayoutBuilder` gives you the parent’s `BoxConstraints` via a callback so you can branch layout by available width/height. It is ideal for responsive breakpoints without hard-coding screen size. It runs during layout, so the callback must stay efficient.

**42. What is FutureBuilder?**  
`FutureBuilder` rebuilds as an async `Future` moves through connection states (waiting, done, error). Pass a stable future (cache it in `State`) or it will restart every build. Pair with error UI and loading placeholders for complete UX.

**43. What is StreamBuilder?**  
`StreamBuilder` listens to a `Stream` and rebuilds on each event with snapshot metadata (waiting, active, done). Remember to cancel underlying subscriptions if you own the stream’s controller in `dispose`. Useful for live data like Firebase snapshots or web sockets.

**44. Future vs Stream?**  
A `Future` completes once with a value or error; a `Stream` emits zero or many events over time. Futures model single async results; streams model ongoing sequences. Choose streams when you need incremental updates or backpressure-aware pipelines.

**45. async/await in Flutter?**  
Dart’s async syntax lets you write non-blocking I/O and computation without nested callbacks; `await` yields to the event loop until the future completes. Always handle errors with `try/catch` or `Future` APIs. After `await`, check `mounted` before updating UI in widgets.

**46. What is isolate?**  
An isolate is Dart’s memory-isolated thread with its own heap and event loop—no shared mutable state between isolates. Communication is via message passing (ports). Use isolates for CPU-heavy work to avoid janking the UI isolate.

**47. Main isolate vs background isolate?**  
The main isolate runs the UI, `build`, and framework bindings; blocking it drops frames. Background isolates do heavy parsing, encryption, or image processing in parallel. UI updates must hop back to the main isolate via `runOnUiThread` patterns or returning results to the main isolate.

**48. Large JSON parsing?**  
Parse in a background isolate using `compute` or `Isolate.run` so main-thread decoding doesn’t stall animations. Consider `json_serializable`/`built_value` for typed, faster access and partial models. Stream or chunk parsing helps for huge payloads.

**49. Platform channel?**  
Platform channels let Dart call into host Java/Kotlin/Objective-C/Swift code and return results asynchronously. They bridge Flutter to OS APIs, sensors, and legacy SDKs. Keep the interface narrow and versioned to ease maintenance.

**50. MethodChannel vs EventChannel?**  
`MethodChannel` is request/response style calls into native code. `EventChannel` exposes a stream of events from native to Dart (e.g., sensor updates). Pick method for imperative operations; event for continuous native pushes.

**51. BLoC pattern?**  
BLoC separates UI from business logic by exposing streams (or `Cubit` with simpler state) of states driven by events. It encourages testable, predictable state transitions and avoids `setState` soup. `flutter_bloc` provides widgets like `BlocBuilder` to listen efficiently.

**52. Provider vs Riverpod vs BLoC?**  
Provider is lightweight `InheritedWidget` sugar with familiar patterns; Riverpod improves compile-safety, scoping, and testability without `BuildContext` for reads. BLoC emphasizes event-driven streams and explicit state machines. Pick based on team familiarity and app complexity—Riverpod/BLoC scale better in large teams.

**53. Dependency injection in Flutter?**  
DI means supplying implementations (API clients, repos) from outside widgets instead of constructing globals inside them. Use constructor injection, `Provider`/`GetIt`/`injectable`, or codegen to wire graphs. It improves testing because you can swap fakes for real services.

**54. Mixin?**  
Mixins reuse method implementations across multiple class hierarchies in Dart with `mixin` and `with` clauses. They avoid deep inheritance chains for cross-cutting behavior (`TickerProviderStateMixin`). Composition via mixins keeps `State` classes smaller and focused.

**55. Extension methods?**  
Extensions add methods to existing types without subclassing, improving readability (`'hello'.isEmail`). They are static dispatch resolved at compile time on the static type. Great for model/formatting helpers scoped to features.

---

## Advanced

**56. Flutter rendering pipeline in detail?**  
Layout: parents pass constraints down, children return sizes up, parents position children. Paint: `RenderObject.paint` draws into `Canvas` with clips and layers. Compositing merges layers into a scene submitted to the GPU each frame. Input and animations schedule new frames through the binding.

**57. How 60fps?**  
Flutter targets a frame budget (~16.6 ms at 60 Hz) by batching work, retaining render objects, and repainting only dirty regions when possible. GPU-accelerated Skia/Impeller reduces overdraw costs. Avoid blocking the UI isolate; profile to keep build/layout/paint under budget.

**58. setState internally?**  
`setState` marks the element dirty and schedules a frame via `scheduleBuildFor` on the `BuildOwner`. On the next frame, `rebuild` runs `build()` to produce a new widget tree reconciled against the old. Synchronous closure ensures state and UI stay consistent before scheduling.

**59. Element reconciliation?**  
Reconciliation walks the new and old widget trees, updating, moving, or creating elements and render objects where types and keys match. Unmatched subtrees are unmounted and disposed. This incremental update avoids rebuilding the entire tree from scratch each frame.

**60. Diff widget trees?**  
Flutter compares child lists by slot and `runtimeType` plus `key`; it updates in place when possible or replaces subtrees when types differ. Global structure changes may force new elements. Efficient lists use stable keys so diff moves items instead of recreating state.

**61. Why widgets immutable?**  
Immutability makes `build` a pure function of configuration, simplifies equality checks, and enables aggressive reuse and caching. Changes are modeled as new widget instances, which clarifies data flow and aids debugging/time-travel patterns. The framework owns mutable state in elements/render objects instead.

**62. Layout constraints management?**  
Constraints are `min/max` width and height passed top-down; a child must pick a size within them. Parents like `Center` loosen constraints; `BoxConstraints.tightFor` forces exact sizes. Understanding who is the “boss” in each parent/child pair resolves most layout bugs.

**63. BoxConstraints?**  
`BoxConstraints` encodes permissible width/height ranges for a child during layout. `RenderObject` implements `performLayout` using these rules. Helpers like `expand`, `tighten`, and `loosen` adjust constraint propagation.

**64. Tight vs loose constraints?**  
Tight constraints fix an exact size (min equals max); the child has no choice. Loose constraints allow a range; the child picks an intrinsic or desired size. `Flex` children receive tight main-axis space when expanded and loose cross-axis unless forced.

**65. Intrinsic height/width?**  
Intrinsic dimensions let a parent ask children “how tall would you be if width were X?” before final layout—expensive because it may lay out children twice. Widgets like `IntrinsicHeight` should be used sparingly. Prefer explicit constraints or `LayoutBuilder` when possible.

**66. RenderObject?**  
`RenderObject` handles layout, painting, hit testing, and semantics for a render element. It mutates geometry and marks needs-layout/paint flags. Most apps use widgets; custom render objects unlock advanced layout/performance control.

**67. Custom RenderObject?**  
Subclass `RenderBox`, implement `performLayout`, `paint`, and optionally `hitTestChildren`. Provide a widget via `SingleChildRenderObjectWidget` or `MultiChildRenderObjectWidget`. Use when widget composition cannot express efficient layout or painting.

**68. Layer tree?**  
Layers (`PictureLayer`, `OpacityLayer`, etc.) structure what gets composited; repaint boundaries promote subtrees into separate layers. The compositor flattens layers into a GPU scene. More layers trade isolation for memory/compositing cost.

**69. Compositing?**  
Compositing combines layers with transforms, opacity, and clips into a final image for the GPU. It enables effects like shadows and clips without repainting everything below. Impeller/Skia backends optimize this path differently but conceptually align.

**70. Skia in Flutter?**  
Skia is a 2D graphics library that draws vector graphics, text, and images onto surfaces using GPU backends. Flutter historically relied on Skia inside the engine for cross-platform consistency. It abstracts platform graphics APIs behind one rendering model.

**71. Flutter and GPU?**  
The engine uploads display lists or scene data to the GPU for rasterization; shaders handle transforms and blending. Metal/Vulkan/GL backends depend on platform. Keeping draw calls and overdraw low improves frame time.

**72. Frame scheduling?**  
`SchedulerBinding` schedules tasks, post-frame callbacks, and transients around vsync pulses. Work is prioritized: animations, then microtasks, then the next frame’s build/layout/paint. Missed deadlines cause jank counters to rise.

**73. SchedulerBinding?**  
It connects the Flutter framework to the engine’s vsync and idle callbacks, exposing `scheduleFrameCallback`, `addPostFrameCallback`, and scheduling policies. WidgetsBinding mixes it in for build scheduling. It is the central clock for frame-aligned work.

**74. vsync?**  
Vsync aligns buffer swaps with display refresh to avoid tearing; Flutter schedules frames on vsync ticks. Animations use `Ticker` driven by vsync to advance smoothly. Disabling or mismatched vsync leads to stutter or tearing.

**75. Ticker?**  
A `Ticker` fires once per frame while enabled, driving `AnimationController` to interpolate values over time. It respects app lifecycle (paused when inactive). Multiple tickers coordinate through `TickerProvider`.

**76. Animations internally?**  
`AnimationController` moves between bounds over a duration using a `Ticker`; `Curve` shapes interpolation. Listeners mark dependents dirty or update render object properties. Implicit animations wrap controllers for simpler APIs.

**77. AnimationController lifecycle?**  
Created with a `TickerProvider`, started forward/reverse/repeat, listened to for value changes, then disposed to detach ticker. It can be bound to `AnimationStatus` listeners for completion callbacks. Failing to dispose leaks tickers.

**78. Implicit vs explicit animations?**  
Implicit widgets (`AnimatedOpacity`, `AnimatedContainer`) animate when properties change with minimal code. Explicit controllers offer full control over duration, curves, sequencing, and multiple linked animations. Choose implicit for simple transitions; explicit for choreography.

**79. Hero animation?**  
`Hero` tags matching widgets across routes; during navigation the framework flights a shared transition rectangle between start and end rects. It requires consistent tag strings and overlapping timelines. Works best with simple rectangular targets.

**80. CustomPainter?**  
`CustomPainter` lets you draw directly on a `Canvas` with paths, paints, and text for charts, signatures, or bespoke visuals. `shouldRepaint` controls invalidation granularity. Prefer widgets if composition suffices; painter for procedural drawing.

**81. CustomPainter vs widget?**  
Widgets excel at composition, accessibility, and hit testing integration; painters excel at efficient vector drawing and effects. Complex interactive UIs may combine both—widgets for structure, painter for visuals. Test accessibility when using raw painters.

**82. Optimize scroll performance?**  
Use builders/slivers, cache extent wisely, avoid heavy work in `build`, use `AutomaticKeepAliveClientMixin` judiciously, and stabilize item extents when possible. Images should be sized and cached; avoid synchronous I/O in item builders. Profile GPU and UI threads.

**83. Sliver?**  
Slivers are scrollable segments composing a `CustomScrollView`; they lazily layout along the scroll axis. Examples: `SliverList`, `SliverGrid`, `SliverAppBar`. They enable advanced scrolling effects unified under one scrollable.

**84. SliverList vs ListView?**  
`ListView` is a convenience wrapper around `SliverChildListDelegate` or `SliverChildBuilderDelegate` inside a `ScrollView`. `SliverList` is the low-level piece you combine in `CustomScrollView` with other slivers. Use direct slivers when mixing headers, grids, and collapsing bars.

**85. Infinite scrolling efficiently?**  
Paginate data, fetch next page near the end with `ScrollController` listeners, and show placeholders. Deduplicate items and use stable keys; debounce network calls. Consider `SliverAnimatedList` patterns for inserts; avoid resetting the whole list on each fetch.

**86. Memory leak in Flutter?**  
Leaks happen when listeners, streams, controllers, or native handles outlive widgets—often from forgotten `dispose` or long-lived closures capturing `BuildContext`. `GlobalKey` misuse and caches without eviction also grow memory. Tools like DevTools memory snapshots help find retaining paths.

**87. Detect memory leaks?**  
Use DevTools memory timeline, heap snapshots, and track widget/controller counts over navigations. Watch for climbing instances of `State` or `Picture` objects. Automated tests can navigate flows repeatedly and assert stable memory.

**88. DevTools?**  
Flutter DevTools provides inspector, performance overlay, CPU profiler, memory views, network logging, and logging integrations. It attaches to a running VM service for deep diagnostics. Essential for production-grade performance work.

**89. CPU vs memory profiling?**  
CPU profiling finds hot Dart functions and frame phases causing jank. Memory profiling finds leaks, large retained objects, and image cache bloat. Use CPU when frames miss budget; memory when RSS climbs or OOMs appear.

**90. Widget rebuild profiling?**  
DevTools can highlight which widgets rebuild per frame—look for unexpected churn from upstream `setState` or broad provider reads. Combine with `debugPrintRebuildDirtyWidgets` in debug builds. Fix by localizing state and using selectors.

---

## Very advanced

**91. Scalable state management system?**  
Define clear layers: UI, domain, data; use unidirectional data flow with explicit events/commands and immutable state snapshots. Scope state containers to features, use codegen for safety, and integrate caching and persistence behind repositories. Instrument rebuilds and enforce lint rules to prevent antipatterns.

**92. Build your own state management (e.g., PipeX-style)?**  
Expose a small API: subscribe, dispatch, select slices, and dispose scopes; back it with `Listenable` or streams and weak references to avoid leaks. Ensure thread-safety rules (main isolate only for UI) and deterministic update ordering. Test with pure reducers/transformers and golden/widget tests.

**93. Reactive system without streams?**  
Use `Listenable`/`ChangeNotifier`, `ValueNotifier`, or manual `addListener` with selector widgets—still reactive but pull/push hybrid. Alternatively use `InheritedNotifier` for scoped propagation. Streams add backpressure/async ergonomics but are not mandatory for reactivity.

**94. Dirty elements?**  
When marked dirty, elements rebuild on the next frame to reconcile new widgets; layout/paint dirty flags cascade to render objects. The `BuildOwner` tracks dirty lists and processes them in a defined order. Batch updates reduce redundant traversals.

**95. BuildOwner?**  
`BuildOwner` manages the element tree lifecycle: scheduling builds, inactive elements, and global keys registry. Each `WidgetsFlutterBinding` has a primary owner. Advanced testing can use separate owners for independent trees.

**96. Element lifecycle?**  
Elements are created, mounted, updated via new widgets, deactivated when moved/removed, and unmounted when discarded. `State` attaches to `StatefulElement` following this rhythm. Global key reparenting can move elements without full recreation.

**97. Mount / unmount?**  
Mounting inserts an element into the tree and creates/attaches render objects; unmounting detaches and disposes them. Between, `activate`/`deactivate` handle subtree moves. Proper unmount triggers `dispose` on `State`.

**98. GlobalKey performance?**  
Global keys require registry lookups and prevent some tree optimizations; repainting or hit testing may traverse more globally. They are fine when needed but costly at scale. Prefer `ValueKey`/`ObjectKey` when locality suffices.

**99. Overusing GlobalKey danger?**  
It breaks locality, encourages tight coupling, complicates tests, and can create performance hotspots or stale references if misused across async gaps. It bypasses normal data flow, hiding dependencies. Reserve for `Form` state, focus, or measured sizes.

**100. Manual diffing?**  
You could compare ordered child lists by keys/types and emit patch operations (insert/move/remove)—similar to what Flutter’s element update does. Stable keys make minimal edit scripts. Doing this outside Flutter is rare except for custom declarative UIs.

**101. Retained vs immediate mode?**  
Retained mode keeps a scene graph (Flutter’s trees) updated incrementally; immediate mode redraws everything each frame from commands. Retained suits UI with localized changes; immediate suits some games or prototypes. Flutter is predominantly retained at the widget/render layer.

**102. Flutter vs React reconciliation?**  
Both diff trees to minimize work; Flutter uses elements/render objects with parent-child constraints, while React Fiber schedules work with priorities and hooks. Flutter’s layout is separate explicit pass; the web React reconciler targets DOM attributes. Keys solve analogous identity problems.

**103. Own widget binding?**  
You’d implement a `WidgetsBinding`/`RendererBinding` subset hooking `PlatformDispatcher` callbacks, driving `drawFrame`, and managing roots—essentially embedding Flutter’s engine manually. This is advanced embedding territory. Most apps use provided bindings.

**104. WidgetsBinding?**  
Mixes `SchedulerBinding`, `GestureBinding`, `RendererBinding`, etc., to wire the framework to the engine. `runApp` registers the root and schedules initial build. Hot reload hooks into this binding layer.

**105. Intercept frame rendering?**  
Use `SchedulerBinding.instance.addPostFrameCallback`, `WidgetsBindingObserver` for metrics, or custom `RenderView`/`SceneBuilder` hooks in embedder scenarios. You can also wrap `dart:ui` `PlatformDispatcher.onBeginFrame`. Respect frame deadlines when injecting work.

**106. Custom navigation system?**  
You can manage a stack or tree of `Navigator` pages, use `Router` with `RouteInformationParser`/`RouterDelegate`, or build an overlay-based system with your own route store. Deep links require parsing URI state and restoring stacks. Keep restoration IDs for process death.

**107. Navigator 1.0 vs 2.0?**  
1.0 is imperative (`push`/`pop`)—simple but awkward for deep links and web URLs. 2.0 is declarative `Router` syncing app state ↔ route information—more boilerplate but web/deeplink friendly. Packages like `go_router` reduce 2.0 pain.

**108. Deep linking?**  
Parse incoming URIs in `MaterialApp.router`/`go_router`, map paths to app state, and restore navigation stacks. On mobile, integrate OS link APIs and handle cold starts. Test ambiguous routes and authentication gates.

**109. Offline-first app?**  
Persist authoritative data locally (SQLite/Isar/Hive), queue writes with sync status, and resolve conflicts with clear rules (LWW, CRDTs, or domain-specific merges). Expose connectivity-aware repositories and optimistic UI with rollback. Test airplane mode transitions exhaustively.

**110. Caching layer?**  
Cache immutable DTOs with TTL/eviction, separate memory vs disk tiers, and key by stable ids/URLs. Use `ImageCache` settings for images and HTTP caches (`dio_cache_interceptor`) for APIs. Invalidate on writes and version schema changes.

**111. App lifecycle states?**  
Mobile apps move through resumed, inactive, paused, detached; handle them via `WidgetsBindingObserver`. Save critical state on pause, pause expensive work, and resume subscriptions on resume. Web/desktop have analogous visibility events.

**112. AppLifecycleState?**  
Enum reported by `didChangeAppLifecycleState` for transitions like `paused` or `resumed`. Use it to throttle animations, flush analytics, or secure screens. Combine with `RouteObserver` for screen-level lifecycle.

**113. Optimize startup time?**  
Defer heavy initialization, shrink bundles, reduce synchronous work in `main`, warm up isolates lazily, and use deferred imports where supported. Minimize plugin registration cost and precompile shaders (Impeller reduces some jank). Measure with trace timelines.

**114. Reduce APK/IPA size?**  
Enable tree shaking, split ABIs, strip debug symbols for release, use `--split-debug-info`, compress assets, and audit dependencies. Avoid bundling unused fonts and locales; use deferred loading for rare features. Review Play/App Store app bundle settings.

**115. Large apps (modular architecture)?**  
Split by feature modules with clear public APIs, shared `core` packages, and dependency rules enforced by lint or Melos. Keep UI, domain, and data separated per feature. CI should build/test modules independently where possible.

**116. Feature modules?**  
Each feature exposes routes, DI registrations, and widgets while hiding internals. Use `package:` imports and barrel files carefully to prevent cycles. Navigation and analytics become cross-cutting contracts.

**117. Monorepo vs multi-repo?**  
Monorepos ease atomic refactors, shared tooling (Melos), and consistent versions; multi-repos isolate release cadences and permissions. Flutter teams often monorepo apps + packages; publish internal packages via private pub or git refs.

**118. Flutter in existing native apps?**  
Embed via Flutter modules (`FlutterEngine`/`FlutterViewController`/`FlutterActivity`) with controlled entry points and engine groups for multiple surfaces. Define clear handoff for auth and navigation between native and Flutter. Mind memory and engine lifecycle.

**119. Write plugins?**  
Create a federated plugin with `android`, `ios`, `web` implementations sharing a common Dart API; use Pigeon for type-safe channels. Version APIs, document threading expectations, and add integration tests. Publish with changelog discipline.

**120. Debug platform channel issues?**  
Log arguments and types both sides, verify method names match, and test on real devices. Use breakpoints in native handlers and Dart `catch` for `MissingPluginException`. Ensure plugin registration in add-to-app setups.

**121. Threading issues?**  
Only mutate UI from the platform thread/main isolate; native callbacks may arrive on background threads—marshal to main before calling Dart. Isolates share no memory—race conditions move to port ordering. Use locks in native code when sharing with Dart callbacks.

**122. Isolate communication?**  
Pass messages via `SendPort`/`ReceivePort`; objects must be sendable (immutable primitives, lists, transferables). Use `Isolate.spawn` with initial message to bootstrap ports. Higher-level APIs like `compute` wrap simple call/response patterns.

**123. SendPort / ReceivePort?**  
`ReceivePort` listens; `SendPort` is the stable handle you pass to other isolates to post messages. Close ports to free resources. Ownership transfers for `TransferableTypedData` avoid copying large buffers.

**124. Real-time updates efficiently?**  
Throttle UI updates, coalesce events, use `Stream` transformers, and render only diffs (e.g., `ListView.builder` with stable keys). For high-frequency data, decouple sampling rate from frame rate via notifiers updated at most once per frame.

**125. High-performance 10k-item list?**  
Use slivers/builders, fixed/extent delegates, `findChildIndexCallback` where needed, and avoid expensive per-item layouts. Virtualize secondary data (images, subtitles) with caching. Consider two-level lists or pagination if items are heterogeneously heavy.

**126. Avoid animation jank?**  
Precompile shaders where relevant, keep tween work cheap, avoid layout thrash during animations, and use `RepaintBoundary` around animated subtrees. Run heavy work off the UI thread. Profile with performance overlay.

**127. Frame drop analysis?**  
Use timeline traces to see long build/layout/paint phases and raster thread spikes. Correlate drops with user actions or GC pauses. Address dominant cost first—often build overwork or shader compilation.

**128. Rebuild granularity?**  
Push state down to smallest widgets, use selectors, split widgets to isolate `setState` scope, and memoize child widgets with `const` and stable keys. Avoid rebuilding `MaterialApp` for local toggles.

**129. Widget memoization?**  
Cache subtree widgets or use `AutomaticKeepAlive` for expensive tabs; `const` constructors are the simplest memo. Some patterns wrap `Child` parameters to prevent parent rebuild churn. Measure—memoization can also retain stale UI if misapplied.

**130. Own rendering layer (C++ + Skia plan)?**  
You’d embed Skia (or another rasterizer), manage surfaces and input, and bridge to Dart via FFI or a custom engine—essentially reimplementing slices of the Flutter engine. Requires deep graphics and platform expertise. Flutter’s embedder API is the closest supported path.

**131. Engine vs framework?**  
The engine (C++) handles rasterization, text, compositing, platform channels, and dart VM embedding. The framework (Dart) provides widgets, rendering protocol, and gestures atop `dart:ui`. Changes to engine require different skills and release cadence than app Dart code.

**132. Replace Skia?**  
You’d supply an alternate graphics backend implementing the engine’s expectations—Impeller is Flutter’s modern approach on some platforms. Third-party replacement is non-trivial and outside normal app dev. It’s an engine-team concern.

**133. Impeller?**  
Impeller precompiles shaders to reduce runtime jank and uses a Metal/Vulkan-centric pipeline on supported platforms. It aims for more predictable performance than legacy Skia JIT shader compilation paths. Rollout is platform-dependent; check current support matrices.

**134. Flutter web internals?**  
Dart compiles to JavaScript or WebAssembly; the framework targets DOM or CanvasKit renderers backed by WebGL canvases. The browser event loop replaces mobile embedders; text and fonts differ from mobile. Performance characteristics diverge from mobile accordingly.

**135. CanvasKit vs HTML renderer?**  
CanvasKit bundles Skia WASM for pixel parity with mobile at heavier download/size cost. HTML renderer maps closer to DOM/CSS with smaller payload but layout/paint differences. Choose based on fidelity vs load-time budgets.

**136. SEO in Flutter web?**  
Use server-side rendering or prerender critical routes, meaningful titles/meta via `web` interop or hosting integration, and semantic HTML where using HTML renderer. Pure client-only SPAs struggle with crawlers—hybrid approaches help. Measure with search console.

**137. Secure Flutter apps?**  
Enforce TLS pinning where appropriate, use platform keystore/biometrics, avoid logging secrets, and validate server certificates. Keep dependencies updated and use obfuscation for release. Never store keys in plaintext source.

**138. Code obfuscation?**  
`flutter build` supports Dart symbol obfuscation with separate debug info files to shrink and hinder reverse engineering. It does not encrypt assets or prevent determined attackers. Combine with server-side secrets for sensitive logic.

**139. Reverse engineering risks?**  
APKs/IPAs can be decompiled; Dart snapshots are recoverable to some degree. Treat client code as observable—protect business rules server-side. Obfuscation raises cost but is not absolute protection.

**140. Custom gesture system?**  
Use `Listener`/`GestureDetector` composition, or implement `GestureRecognizer` subclasses participating in the gesture arena. For low-level control, handle `PointerRouter` events via `RawGestureDetector`. Document precedence with team to avoid conflicts.

**141. Gesture arena?**  
Competing recognizers enter an arena; winners capture the gesture stream based on rules and timeouts. This resolves ambiguities like tap vs drag. Understanding arena outcomes explains “why my onTap didn’t fire.”

**142. Hit testing?**  
Hit testing walks render objects from front to back in Z-order to find targets under a point, respecting transforms, clips, and ignoring offstage subtrees. `HitTestBehavior` changes how translucent widgets participate. Debugging uses `debugPaintPointers` flags.

**143. Accessibility?**  
Flutter builds a semantics tree parallel to widgets describing roles, labels, actions, and states for screen readers. Good semantics require explicit labels on icons/buttons and live regions for dynamic content. Test with TalkBack/VoiceOver.

**144. Semantics tree?**  
Merged from render objects and widgets, it exposes accessibility APIs to the OS. Custom painters may need `Semantics` widgets to remain navigable. Performance tools can visualize semantics bounds.

**145. Testable Flutter code?**  
Inject dependencies, keep widgets dumb, test logic with pure unit tests, and pump widgets with `WidgetTester`. Avoid static globals; use fakes for `Platform` channels. Golden tests lock visuals.

**146. Widget vs integration testing?**  
Widget tests run headless in VM with fake platform, fast for UI units. Integration tests drive real devices/emulators end-to-end with slower feedback. Use both: widget for regressions, integration for critical flows.

**147. Golden tests?**  
Compare rasterized widget images to approved baselines to catch visual regressions. Update goldens deliberately in CI with reviewed diffs. Sensitive to font rendering differences across platforms—run on consistent environments.

**148. Mock platform channels?**  
Use `TestDefaultBinaryMessenger` to stub method calls in tests, or dependency-inject services that abstract channels. `integration_test` can use fakes for flaky native dependencies. Record/replay patterns help complex natives.

**149. CI/CD for Flutter?**  
Cache `pub` and Gradle/CocoaPods artifacts, run `analyze`, `test`, `integration_test` on emulators, and build signed artifacts per flavor. Gate merges on formatting and coverage thresholds. Distribute via fastlane/App Store Connect/Play Console.

**150. Benchmark Flutter vs native?**  
Define comparable scenarios (list scroll, cold start, animation throughput) and measure on identical hardware with tracing tools. Native may win on niche platform-specific APIs; Flutter often wins on dev speed and consistent UI. Honest benchmarks disclose renderer, build mode, and device class.

---

## Bonus

**151. Why widget immutability?**  
Immutability simplifies reasoning, enables structural sharing, and makes reconciliation predictable by comparing object fields. Mutable widgets would blur ownership with elements and invite inconsistent frames. It aligns with functional UI patterns proven in other frameworks.

**152. Flutter without BuildContext?**  
Much of the framework is wired through context lookups for inherited widgets and navigation; eliminating it would require another service locator or effect system. Riverpod reduces reliance for reads, but widgets still need context for many APIs. A hypothetical redesign might use explicit handles.

**153. Remove Element tree?**  
Elements are the stable anchor between ephemeral widgets and mutable render objects—without them, you’d need another reconciliation strategy or immediate-mode redraws. They enable efficient updates and `State` preservation. Removing them would fundamentally change Flutter’s architecture.

**154. Multithreaded UI?**  
Flutter’s UI and GPU submission are designed around a single UI isolate for simplicity and safety; other threads handle I/O and isolates for compute. Sharing mutable UI across threads would race the framework. Alternatives would need a different rendering contract.

**155. Not exactly React’s diff?**  
Flutter targets retained render objects with layout passes separate from reconciliation, unlike DOM property patching. Fiber-style scheduling priorities differ. Both use keys and tree diffing but optimize for different host models.

**156. Real bottleneck?**  
Often excessive rebuilds, large builds in `build()`, shader compilation (legacy Skia), main-isolate blocking, oversized images, or network waits on the UI thread. Measure—assumptions without profiling mislead. Raster thread overload also appears as jank.

**157. When Flutter is NOT ideal?**  
When you need cutting-edge AR/VR, heavy platform-specific UI fidelity, or tiny binary footprints on ultra-constrained devices without trade-offs. Teams deeply invested in native-only stacks may prefer native. Regulatory constraints around specific OEM APIs can tilt native.

**158. Redesign Flutter from scratch?**  
You might simplify state primitives, tighten compile-time routing, unify web/mobile semantics, and choose a renderer with predictable shaders from day one—while preserving hot reload and layered architecture. Any redesign balances embedder complexity vs developer ergonomics. Easier said than done.

**159. Flutter without Skia?**  
Engine builds already explore Impeller and other backends; “Flutter” as a product is tied to its engine’s renderer. Theoretically another rasterizer could plug in at engine level. Apps alone cannot remove Skia without replacing the engine.

**160. Implement your own rendering engine?**  
Possible with enough graphics/OS expertise—many game engines do—but you lose Flutter’s ecosystem benefits. Embedding Skia/Impeller or using Flutter’s engine is the pragmatic path unless you are building a new platform. Expect years of engineering for parity.

---

*Generated for study and interviews—verify details against current Flutter docs for your target SDK version.*

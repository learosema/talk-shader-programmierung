// A shader-art plugin that turns pointer drag + wheel into a classic orbit camera,
// built on top of @shader-art/plugin-pointer-interactions instead of re-implementing
// pointer capture: that package hands us normalized (0..1) `x`/`y`/`dragging` per
// event via `subscribe()`, but no delta between events, so an orbit needs to
// accumulate that itself (see shader-art-wishlist.md) - that's the only thing this
// plugin adds. Drag to orbit, wheel to zoom; exposes the result as a single
// `uniform vec3 cameraPos;`, meant as a drop-in for a hand-rolled orbiting camPos
// (see the `raymarch-sphere` preset).
import { PointerInteractionsPlugin } from '@shader-art/plugin-pointer-interactions';

const MAX_ELEVATION = 1.5; // radians, just under +/-90 deg - avoids the pole flip

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

export class OrbitControlsPlugin {
  name = 'OrbitControlsPlugin';

  constructor({
    azimuth = 0.6,
    elevation = 0.4,
    distance = 4,
    minDistance = 1.8, // stay outside the pumpkin preset's shell (radius ~1.1) so the camera never ends up inside solid geometry
    maxDistance = 20,
    sensitivity = Math.PI * 2, // radians of orbit per full drag across the canvas
    zoomSensitivity = 0.001,
  } = {}) {
    this.azimuth = azimuth;
    this.elevation = elevation;
    this.distance = distance;
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.sensitivity = sensitivity;
    this.zoomSensitivity = zoomSensitivity;

    this.pointerPlugin = new PointerInteractionsPlugin();
    this.pointerPlugin.subscribe(this.onPointer);
    this.lastX = null;
    this.lastY = null;
    this.hostElement = null;
    this.didSetup = false;
  }

  // plugin-pointer-interactions gives us an absolute position per event, not a
  // delta - so we track the previous position ourselves and turn the difference
  // into an orbit offset, resetting once a drag ends so the next one starts fresh.
  onPointer = (x, y, dragging) => {
    if (!dragging) {
      this.lastX = null;
      this.lastY = null;
      return;
    }
    if (this.lastX !== null) {
      // Trackball-style: drag right/up like grabbing and turning the object that
      // way, not like panning a camera - i.e. the opposite sign of what turning
      // the camera itself by that angle would need.
      this.azimuth -= (x - this.lastX) * this.sensitivity;
      this.elevation = clamp(this.elevation + (y - this.lastY) * this.sensitivity, -MAX_ELEVATION, MAX_ELEVATION);
    }
    this.lastX = x;
    this.lastY = y;
  };

  onWheel = (e) => {
    e.preventDefault();
    this.distance = clamp(this.distance * Math.exp(e.deltaY * this.zoomSensitivity), this.minDistance, this.maxDistance);
  };

  setup(hostElement, gl, program, canvas) {
    this.hostElement = hostElement;
    // shader-art calls setup() again after a hard reset (the "Reset time" button
    // detaches/reattaches the element, forcing it through dispose()+setup()), but
    // plugin-pointer-interactions never removes its own listeners in dispose() -
    // re-running setup() would attach a second set. See dispose() below for why
    // this can't just rely on dispose() clearing that flag instead.
    if (this.didSetup) return;
    this.didSetup = true;
    hostElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.pointerPlugin.setup(hostElement, gl, program, canvas);
  }

  onFrame(hostElement, gl, program, canvas) {
    // gl/program are passed in fresh on every frame (unlike the ones cached in
    // setup()), which matters here: shader-art's reinitialize() recreates the
    // program but never calls setup() again on existing plugins, so anything
    // cached from setup() would go stale after the first edit. Reading the
    // uniform location fresh each frame sidesteps that for our own cameraPos write
    // below - but pointerPlugin caches gl/program from its own one-time setup()
    // too, and keeps writing its `pointer`/`pointerStart`/`dragging` uniforms with
    // those on every drag event, which throws "attempt to use a deleted object"
    // once the program they point at gets recreated. Refreshing its cache from
    // what we get here (both are plain instance fields, not really private) keeps
    // that quietly correct instead of forking the plugin just for this.
    this.pointerPlugin.gl = gl;
    this.pointerPlugin.program = program;
    this.pointerPlugin.canvas = canvas;

    const loc = gl.getUniformLocation(program, 'cameraPos');
    if (!loc) return;
    const cosElevation = Math.cos(this.elevation);
    gl.uniform3f(
      loc,
      this.distance * cosElevation * Math.sin(this.azimuth),
      this.distance * Math.sin(this.elevation),
      this.distance * cosElevation * Math.cos(this.azimuth),
    );
  }

  // Deliberately a no-op. shader-art's reinitialize() - which runs on every
  // recompile while editing, not just on a real teardown - calls dispose() on every
  // active plugin, but then keeps reusing this same instance afterwards instead of
  // replacing it (see shader-art-wishlist.md). A real dispose() here (nulling
  // hostElement, tearing down pointerPlugin) broke the still-attached pointer
  // listeners after the very first keystroke: they kept firing, but their handlers
  // bail out as soon as they read a null hostElement/gl. Since neither this plugin
  // nor plugin-pointer-interactions ever actually removes its listeners anyway,
  // there is nothing safe to tear down here short of a full page unload.
  dispose() {}
}

export const createOrbitControlsPlugin = (options) => () => new OrbitControlsPlugin(options);

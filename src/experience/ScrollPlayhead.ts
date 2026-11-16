/** A frame-rate independent, critically damped playhead driven by native scroll. */
export class ScrollPlayhead {
  position = 0;
  target = 0;
  velocity = 0;

  constructor(private response = 10) {}

  setResponse(response: number) {
    this.response = response;
  }

  seek(value: number) {
    this.target = Math.max(0, Math.min(1, value));
  }

  /** Direct chapter navigation and reduced motion must land immediately. */
  snap(value = this.target) {
    this.seek(value);
    this.position = this.target;
    this.velocity = 0;
    return this.position;
  }

  transition(from: number, to: number) {
    this.position = Math.max(0, Math.min(1, from));
    this.velocity = 0;
    this.seek(to);
    return this.position;
  }

  advance(deltaSeconds: number) {
    // A long background/blocked frame must not teleport the camera forward.
    const dt = Math.max(0, Math.min(0.05, deltaSeconds));
    const offset = this.position - this.target;
    const impulse = this.velocity + this.response * offset;
    const decay = Math.exp(-this.response * dt);
    this.position = Math.max(0, Math.min(1, this.target + (offset + impulse * dt) * decay));
    this.velocity = (this.velocity - this.response * impulse * dt) * decay;
    if (Math.abs(this.position - this.target) < 0.000001 && Math.abs(this.velocity) < 0.00001) this.snap();
    return this.position;
  }
}

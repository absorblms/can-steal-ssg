import StacheElement from "can-stache-element"
import "./moo.css"

class Moo extends StacheElement {
  static view = `
    <h3>Moo</h3>

    <p>Cows go Moooo~~</p>
    <p>First: {{ first }}</p>
    <p>Second: {{ second }}</p>
  `

  static props = {
    first: "",
    second: "",
  }

}

customElements.define("progressive-moo", Moo)

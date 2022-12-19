import StacheElement from "can-stache-element";
import "./app.css";

class AppMain extends StacheElement {
  static view = `
    <h3>Cow</h3>

    <p>Top 5 animal in the world is Cow</p>
    <p>First: {{ first }}</p>
    <p>Second: {{ second }}</p>
		<button on:click="this.click()">Click</button>
		{{# if(this.clicked) }}clicked{{/ if}}
  `

  static props = {
    first: "",
    second: "",
		clicked: {default: false}
  }

  connected() {
    setTimeout(() => {
      this.first = "300 milliseconds have passed"
    }, 300)

    setTimeout(() => {
      this.second = "0.01 minutes have passed"
    }, 600)
  }
	click(){
		this.clicked = true;
	}
}

customElements.define("app-main", AppMain)

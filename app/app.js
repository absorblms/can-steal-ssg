import StacheElement from "can-stache-element";
import "./app.css";
import route from "can-route";
import "can-stache-route-helpers";
import RoutePushstate from "can-route-pushstate";

route.urlData = new RoutePushstate();
route.register("{page}", { page: "home" })
route.start()


class AppMain extends StacheElement {
  static view = `
    <h3>Cow</h3>

    <p>Top 5 animal in the world is Cow</p>
    <p>First: {{ first }}</p>
    <p>Second: {{ second }}</p>
		<button on:click="this.click()">Click</button>
		{{# if(this.clicked) }}clicked{{/ if}}

		<p><a href="{{ routeUrl(page='home') }}">Home</a></p>
		<p><a href="{{ routeUrl(page='moo') }}">Moo</a></p>
		<div>
			{{# if(this.componentToShow.isPending) }}
					<h2>Loading...</h2>
			{{/ if }}
			{{# if(this.componentToShow.isRejected) }}
				<h2>Rejected {{ this.componentToShow.reason }}</h2>
			{{/ if }}
			{{# if(this.componentToShow.isResolved) }}
					{{ this.componentToShow.value }}
			{{/ if }}
		</div>

  `

  static props = {
    first: "",
    second: "",
		clicked: {default: false},
		routeData: {
      get default() {
        return route.data
      },
    },
		get componentToShow() {
	    switch (this.routeData.page) {
	      case "home":
	        const home = document.createElement("h2");
	        home.innerHTML = "Home";
	        return Promise.resolve(home);
	      case "moo":
					return steal.import(`~/app/moo/moo`).then(() => {
						return document.createElement("progressive-moo")
					})
	      default:
	        const page404 = document.createElement("h2")
	        page404.innerHTML = "Page Missing"
	        return Promise.resolve( page404 );
	    }
	  }
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

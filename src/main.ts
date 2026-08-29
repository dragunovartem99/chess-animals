import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import "./style.css";
import { createApp } from "vue";

import App from "./App.vue";
import { i18n } from "./app/i18n";
import { router } from "./app/router";

createApp(App).use(i18n).use(router).mount("#app");

import { createRenderer, defineComponent, h } from "vue";

// A renderer over nothing: composables with lifecycle hooks need a real component instance, and
// this gives them one without a dom. `unmount` is what runs their `onBeforeUnmount`.
const noop = () => {};

const { createApp } = createRenderer<object, object>({
	insert: noop,
	remove: noop,
	createElement: () => ({}),
	createText: () => ({}),
	createComment: () => ({}),
	setText: noop,
	setElementText: noop,
	patchProp: noop,
	parentNode: () => null,
	nextSibling: () => null,
});

export function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
	let result: T | undefined;

	const app = createApp(
		defineComponent({
			setup: () => {
				result = composable();

				return () => h("div");
			},
		})
	);
	app.mount({});

	return { result: result as T, unmount: () => app.unmount() };
}

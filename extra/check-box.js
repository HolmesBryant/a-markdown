export default class CheckBox extends HTMLElement {
	#inputId;
	#value;
	#label;
	#tooltip;
	#bind;

	#initialized = false;
	ta = document.createElement('textarea');

	static observedAttributes = [
		'input-id',
		'value',
		'label',
		'tooltip',
		'bind'
	]

	constructor() {
		super();
		this.attachShadow( { mode: 'open' } );
	}

	attributeChangedCallback(attr, oldval, newval) {
		if (oldval === newval) return;
		switch (attr) {
		case 'input-id':
			this.#inputId = newval;
			break;
		case 'value':
			this.#value = newval;
			break;
		case 'label':
			this.#label = newval;
			break;
		case 'tooltip':
			this.#tooltip = newval;
			break;
		case 'bind':
			this.#bind = newval.split(':');
			break;
		}

		if (this.#initialized) this.render();
	}

	connectedCallback() {
		this.render();
		this.initialized = true;
	}

	disconnectedCallback() {
		this.ta = null;
	}

	render() {
		let bind, model, prop;
		const bindEnd = "</a-bind>";
		if (this.bind) {
			[model, prop] = this.#bind;
			bind = `<a-bind model="${model}" property="${prop}" func="setOption">`;
		}

		const html = `
		<style>
			:host {
				--gap: 1rem;
				display: block;
			}

			input {
				width: var(--min);
				height: var(--min);
				border: 1px solid var(--border-color);
			}

			.flex {
				align-items: center;
				display: flex;
				flex: 1;
				gap: var(--gap);
			}

			.space-between {
				justify-content: space-between;
			}

			#wrapper {
				width: 100%;
			}
		</style>

		<div id="wrapper" class="flex">
			${bind ? bind : ''}
			<input
				type="checkbox"
				id="${this.inputId}"
				name="${prop}"
				value="${this.value}">
			${bind ? bindEnd : ''}

			<div class="flex space-between">
				<label
					for="${this.inputId}"
					title="${this.tooltip}">
					${this.label}
				</label>

				<a-tooltip position="modal">
					${this.tooltip}
				</a-tooltip>
			</div>
		</div>
	`;

		this.shadowRoot.innerHTML = html;
	}

	sanitize(value) {
		const ta = this.ta || document.createElement('textarea');
		ta.value = value;
		return ta.value;
	}

	get inputId() { return this.getAttribute('input-id') }
	set inputId(value) { this.setAttribute('input-id', value) }

	get value() { return this.getAttribute('value') }
	set value(value) { this.setAttribute('value', value )}

	get label() { return this.getAttribute('label') }
	set label(value) { this.setAttribute('label', value) }

	get tooltip() { return this.getAttribute('tooltip') }
	set tooltip(value) { this.setAttribute('tooltip', value) }

	get bind() { return this.getAttribute('bind') }
	set bind(value) { this.setAttribute('bind', value) }
}

if (!customElements.get('check-box')) customElements.define('check-box', CheckBox);

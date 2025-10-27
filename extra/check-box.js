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
		let bind, bindMarkdown, model, prop;
		const bindEnd = "</a-bind>";
		if (this.bind) {
			[model, prop] = this.#bind;
			bind = `<a-bind model="${model}" property="${prop}">`;
			bindMarkdown = `<a-bind model="${model}" property="markdown">`
		}

		const html = `
		<style>
			:host {
				--gap: .25rem;
				display: block;
			}

			input {
				border: 1px solid var(--border-color);
				cursor: pointer;
				height: var(--min);
				width: var(--min);
			}

			select {
				background: var(--bg2-color);
				border: 1px solid var(--border-color);
				border-radius: 5px;
				color: var(--text-color);
				cursor: pointer;
				padding: .25rem;
			}

			option {
				min-height: 20px;
			}

			.flex {
				align-items: center;
				display: flex;
				gap: var(--gap);
			}

			.flex1 { flex: 1; }

			.column {
				flex-direction: column;
			}

			.gap2 {
				gap: 1rem;
			}

			.space-between {
				justify-content: space-between;
			}

			.start { justify-content: flex-start }

			.column.start {
				align-items: flex-start;
			}

			.wrap {
				flex-wrap: wrap;
			}

			#wrapper {
				width: 100%;
			}
		</style>

		<div id="wrapper" class="flex column start gap2">
			<div class="flex wrap" style="width:100%;">
				${bind ? bind : ''}
	        <input
	          type="checkbox"
	          id="${this.inputId}"
	          name="${prop}"
	          value="${this.value}">
	      ${bind ? bindEnd : ''}

				<div class="flex flex1 space-between">
	        <label
	            for="${this.inputId}"
	            title="${this.tooltip}">
	            ${this.label}
	        </label>

	        <a-tooltip position="modal">
						<b slot="title">${prop}</b>
	          ${this.tooltip}
	        </a-tooltip>
	    	</div>
			</div><!-- /flex -->

			<div class="flex">
				<label for="display">Display:</label>
				<a-bind
					model="${model}"
					property="display">
		    	<select id="display">
		    		<option>converted</option>
						<option>markdown</option>
						<option value="html">raw html</option>
					</select>
					</a-bind>
				</div>
		</div><!-- /wrapper -->
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

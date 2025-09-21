<script lang="ts">
	import { browser } from '$app/environment';
	import { useLiveQuery } from '@tanstack/svelte-db';
	import { todoCollection, configCollection, now, generateId, type Todo } from '$lib/db';
	import { getComplementaryColor } from '$lib/color';

	// Live queries for todos and config - only run in browser
	const todosQuery = browser
		? useLiveQuery((q) =>
				q.from({ todo: todoCollection }).orderBy(({ todo }) => todo.created_at, 'asc')
			)
		: null;

	const configQuery = browser ? useLiveQuery((q) => q.from({ config: configCollection })) : null;

	// Reactive state using $derived
	const todos = $derived(todosQuery?.data ? $todosQuery.data : []);
	const configData = $derived(configQuery?.data);

	// State
	let newTodo = $state('');

	// Helper functions
	function getConfigValue(key: string): string | undefined {
		if (!browser || !configData) return undefined;

		// Access the store value only if we have a valid store
		try {
			const configs = $configData;
			if (!configs) return undefined;

			for (const config of configs) {
				if (config.key === key) {
					return config.value;
				}
			}
		} catch (e) {
			// Store not ready yet
			return undefined;
		}
		return undefined;
	}

	function setConfigValue(key: string, value: string): void {
		if (!browser || !configData) return;

		try {
			const configs = $configData;
			if (!configs) return;

			for (const config of configs) {
				if (config.key === key) {
					configCollection.update(config.id, (draft) => {
						draft.value = value;
					});
					return;
				}
			}

			// If the config doesn't exist yet, create it
			configCollection.insert({
				id: generateId(),
				key,
				value,
				created_at: now(),
				updated_at: now()
			});
		} catch (e) {
			// Store not ready yet
			return;
		}
	}

	// Computed values using $derived
	const backgroundColor = $derived(getConfigValue('backgroundColor') || '#f5f5f5');
	const titleColor = $derived(getComplementaryColor(backgroundColor));

	const activeTodos = $derived(todos.filter((todo: Todo) => !todo.completed));
	const completedTodos = $derived(todos.filter((todo: Todo) => todo.completed));

	// Event handlers
	function handleColorChange(e: Event) {
		const input = e.target as HTMLInputElement;
		setConfigValue('backgroundColor', input.value);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		const text = newTodo.trim();
		newTodo = '';

		if (text && browser) {
			todoCollection.insert({
				text,
				completed: false,
				id: generateId(),
				created_at: now(),
				updated_at: now()
			});
		}
	}

	function toggleAll() {
		if (!browser) return;
		const todosToToggle = activeTodos.length > 0 ? activeTodos : completedTodos;

		todoCollection.update(
			todosToToggle.map((todo: Todo) => todo.id),
			(drafts: any) => drafts.forEach((draft: any) => (draft.completed = !draft.completed))
		);
	}

	function toggleTodo(todo: Todo) {
		if (!browser) return;
		todoCollection.update(todo.id, (draft) => {
			draft.completed = !draft.completed;
		});
	}

	function deleteTodo(id: number) {
		if (!browser) return;
		todoCollection.delete(id);
	}

	function clearCompleted() {
		if (!browser) return;
		todoCollection.delete(completedTodos.map((todo: Todo) => todo.id));
	}
</script>

<main
	class="flex h-dvh justify-center overflow-auto py-8"
	style="background-color: {backgroundColor}"
>
	<div class="w-[550px]">
		<h1 class="mb-4 text-center text-[70px] font-bold" style="color: {titleColor}">💫 ToDos</h1>

		<div class="flex justify-end py-4">
			<div class="flex items-center">
				<label
					for="colorPicker"
					class="mr-2 text-sm font-medium text-gray-700"
					style="color: {titleColor}"
				>
					Background Color:
				</label>
				<input
					type="color"
					id="colorPicker"
					value={backgroundColor}
					on:change={handleColorChange}
					class="cursor-pointer rounded border border-gray-300"
				/>
			</div>
		</div>

		<div
			class="relative bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.2),0_25px_50px_0_rgba(0,0,0,0.1)]"
		>
			<form on:submit={handleSubmit} class="relative">
				<button
					type="button"
					class="absolute h-full w-12 text-[30px] text-[#e6e6e6] hover:text-[#4d4d4d] disabled:cursor-not-allowed"
					disabled={todos.length === 0}
					on:click={toggleAll}
				>
					❯
				</button>
				<input
					type="text"
					bind:value={newTodo}
					placeholder="What needs to be done?"
					class="box-border h-[64px] w-full border-none pl-[60px] pr-4 text-2xl font-light shadow-[inset_0_-2px_1px_rgba(0,0,0,0.03)]"
				/>
			</form>

			<ul class="list-none">
				{#each todos as todo (todo.id)}
					<li class="group relative border-b border-[#ededed] last:border-none">
						<div class="gap-1.2 flex h-[58px] items-center pl-[60px]">
							<input
								type="checkbox"
								checked={todo.completed}
								on:change={() => toggleTodo(todo)}
								class="absolute left-[12px] size-[40px] cursor-pointer"
							/>
							<label
								class="block p-[15px] text-2xl transition-colors {todo.completed
									? 'text-[#d9d9d9] line-through'
									: ''}"
							>
								{todo.text}
							</label>
							<button
								on:click={() => deleteTodo(todo.id)}
								class="absolute right-[20px] hidden text-[30px] text-[#cc9a9a] transition-colors hover:text-[#af5b5e] group-hover:block"
							>
								×
							</button>
						</div>
					</li>
				{/each}
			</ul>

			{#if todos.length > 0}
				<footer
					class="flex h-[40px] items-center justify-between border-t border-[#e6e6e6] px-[15px] text-[14px] text-[#777]"
				>
					<span>
						{activeTodos.length}
						{activeTodos.length === 1 ? 'item' : 'items'} left
					</span>

					{#if completedTodos.length > 0}
						<button on:click={clearCompleted} class="hover:underline"> Clear completed </button>
					{/if}
				</footer>
			{/if}
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
			'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>

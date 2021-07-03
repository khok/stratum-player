export interface ToolSubscriber<T = unknown> {
    toolChanged(tool: T): void;
}

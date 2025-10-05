export interface MockFunction<TArgs extends unknown[], TResult> {
  (...args: TArgs): TResult;
  calls: TArgs[];
  results: TResult[];
  mockReturnValue(value: TResult): MockFunction<TArgs, TResult>;
  mockReturnValueOnce(value: TResult): MockFunction<TArgs, TResult>;
  mockImplementation(impl: (...args: TArgs) => TResult): MockFunction<TArgs, TResult>;
  mockImplementationOnce(impl: (...args: TArgs) => TResult): MockFunction<TArgs, TResult>;
  mockClear(): void;
}

export const createMockFn = <TArgs extends unknown[] = unknown[], TResult = unknown>(
  implementation?: (...args: TArgs) => TResult,
): MockFunction<TArgs, TResult> => {
  const onceQueue: Array<(...args: TArgs) => TResult> = [];
  let defaultImplementation = implementation;
  let hasStaticReturnValue = false;
  let staticReturnValue: TResult;

  const mock = ((...args: TArgs): TResult => {
    const nextImplementation = onceQueue.shift() ?? defaultImplementation;
    let result: TResult;

    if (nextImplementation) {
      result = nextImplementation(...args);
    } else if (hasStaticReturnValue) {
      result = staticReturnValue;
    } else {
      result = undefined as TResult;
    }

    mock.calls.push(args);
    mock.results.push(result);
    return result;
  }) as MockFunction<TArgs, TResult>;

  mock.calls = [] as TArgs[];
  mock.results = [] as TResult[];

  mock.mockReturnValue = (value: TResult) => {
    staticReturnValue = value;
    hasStaticReturnValue = true;
    defaultImplementation = undefined;
    return mock;
  };

  mock.mockReturnValueOnce = (value: TResult) => {
    onceQueue.push(() => value);
    return mock;
  };

  mock.mockImplementation = (impl: (...args: TArgs) => TResult) => {
    defaultImplementation = impl;
    hasStaticReturnValue = false;
    return mock;
  };

  mock.mockImplementationOnce = (impl: (...args: TArgs) => TResult) => {
    onceQueue.push(impl);
    return mock;
  };

  mock.mockClear = () => {
    mock.calls.length = 0;
    mock.results.length = 0;
    onceQueue.length = 0;
  };

  return mock;
};

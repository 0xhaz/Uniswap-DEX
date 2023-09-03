import React from "react";
import Selector from "./selector";

interface SwapFieldProps {
  obj: {
    id: string;
    value: string;
    setValue: (value: string) => void;
    defaultValue: string;
    setToken: (token: string) => void;
    ignoreValue: string;
    exactAmountIn: string;
    setExactAmountIn: (value: string) => void;
  };
}

const SwapField = React.forwardRef<HTMLInputElement, SwapFieldProps>(
  ({ obj }, ref) => {
    const {
      id,
      value = "",
      setValue,
      defaultValue,
      setToken,
      ignoreValue,
      exactAmountIn,
      setExactAmountIn,
    } = obj;

    return (
      <div className="flex items-center rounded-xl">
        <input
          ref={ref}
          className={getInputClassname()}
          type={"number"}
          value={exactAmountIn}
          placeholder={"0.0"}
          onChange={e => {
            setExactAmountIn(e.target.value);
            setValue(e.target.value);
          }}
        />

        <Selector
          id={id}
          setToken={setToken}
          defaultValue={defaultValue}
          ignoreValue={ignoreValue}
        />
      </div>
    );

    function getInputClassname() {
      let className =
        " w-full outline-none h-8 px-2 appearance-none text-3xl bg-transparent";
      return className;
    }
  }
);

export default SwapField;

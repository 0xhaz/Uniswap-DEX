import { useAccount, useProvider, useSigner } from "wagmi";

export function useSignerAddress() {
  const { data: signer } = useSigner();
  return signer;
}

export function useProviderAddress() {
  const provider = useProvider();
  return provider;
}

export function useAccountAddress() {
  const { address } = useAccount();
  return address;
}

"use client";

import { Button, Dialog, Radio } from "chunks-ui";
import { useId } from "react";
import { OverlayHeader, SelectField } from "./parts";

const PROVIDERS = ["GitHub", "GitLab", "Bitbucket"];
const REPOS = ["acme/dashboard", "acme/api", "acme/marketing-site"];

export function ConnectRepoDialog() {
  const providerLabel = useId();

  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="outlined" color="secondary" />}>
        Connect repository
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="flex w-[calc(100%-32px)] flex-col gap-5">
          <OverlayHeader
            title="Connect repository"
            description="Pick a Git provider and the repository to deploy."
          />
          <div className="flex flex-col gap-2">
            <span id={providerLabel} className="font-medium text-sm leading-none">
              Provider
            </span>
            <Radio.Group
              aria-labelledby={providerLabel}
              defaultValue={PROVIDERS[0]}
              className="flex-row flex-wrap gap-x-5 text-sm"
            >
              {PROVIDERS.map((p) => (
                <Radio.Item key={p} value={p}>
                  {p}
                </Radio.Item>
              ))}
            </Radio.Group>
          </div>
          <SelectField label="Repository" items={REPOS} />
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
              Cancel
            </Dialog.Close>
            <Dialog.Close render={<Button />}>Connect</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

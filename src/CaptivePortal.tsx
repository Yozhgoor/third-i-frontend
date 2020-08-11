import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  Button,
  Popover,
  Label,
  Toaster,
  Intent,
  Overlay,
  Spinner,
  ButtonGroup,
} from "@blueprintjs/core";
import "./CaptivePortal.css";
import * as api from "./api";

interface CaptivePortalProps {
  onConnected: (essid: string) => void;
  onAP: () => void;
}

function CaptivePortal({ onConnected, onAP }: CaptivePortalProps) {
  const [networks, setNetworks] = useState([] as api.Network[]);
  const [initialized, setInitialized] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(false);

  const updateNetworks = () => {
    setNetworks([]);
    setError(false);
    api
      .networks()
      .then((x) => setNetworks(x))
      .catch((err) => {
        console.log(err);
        setError(true);
      });
  };

  const connect = (essid: string, password: string) => {
    setConnecting(true);
    setError(false);
    setNetworks([]);

    api
      .connect(essid, password)
      .then((res) => {
        setConnecting(false);

        if (res.success) {
          onConnected(essid);
        } else {
          CaptivePortalToaster.show({
            message: (
              <div>
                Could not connect to "{essid}".
                <br />
                <br />
                Please check that the password is correct. If the problem persists, please contact
                the network administrator.
              </div>
            ),
            intent: Intent.WARNING,
            timeout: 10000,
          });
          updateNetworks();
        }
      })
      .catch((err) => {
        console.log(err);
        setError(true);
        setConnecting(false);
      });
  };

  useEffect(() => {
    if (!initialized) {
      updateNetworks();
      setInitialized(true);
    }
  }, [initialized, networks]);

  return (
    <div className="CaptivePortal-content">
      <Overlay isOpen={connecting}>
        <Spinner size={Spinner.SIZE_LARGE} className="CaptivePortal-spinner" />
      </Overlay>
      <div className="CaptivePortal-list">
        <Menu>
          {networks.length === 0 && (
            <MenuItem icon="refresh" text={error ? "An error occurred" : "Loading..."} disabled />
          )}
          {networks.map(({ essid, password }) =>
            password ? (
              <Popover className="CaptivePortal-popover" position="left" key={essid}>
                <MenuItem icon={password ? "lock" : "unlock"} text={essid} />
                <PasswordEntry onValidate={(password) => connect(essid, password)} />
              </Popover>
            ) : (
              <MenuItem
                key={essid}
                icon={password ? "lock" : "unlock"}
                text={essid}
                onClick={() => alert(essid)}
              />
            )
          )}
        </Menu>
      </div>
      <div className="CaptivePortal-buttons">
        <ButtonGroup>
          <Popover className="CaptivePortal-popover" position="left">
            <Button text="Hidden network..." />
            <HiddenNetwork onValidate={(essid, password) => connect(essid, password)} />
          </Popover>
          <Button
            text="Use access point"
            onClick={() => {
              api.startAp();
              onAP();
            }}
          />
          <Button text="Refresh" onClick={updateNetworks} />
        </ButtonGroup>
      </div>
    </div>
  );
}

interface PasswordEntryProps {
  onValidate: (value: string) => void;
}

function PasswordEntry({ onValidate }: PasswordEntryProps) {
  return (
    <div className="CaptivePortal-password bp3-large bp3-text-large">
      <Label>
        Password:
        <input
          className="bp3-input"
          type="password"
          placeholder="Type ENTER to validate"
          onKeyUp={(ev) => {
            if (ev.key === "Enter") {
              onValidate(ev.currentTarget.value);
            }
          }}
        />
      </Label>
    </div>
  );
}

interface HiddenNetworkProps {
  onValidate: (essid: string, password: string) => void;
}

function HiddenNetwork({ onValidate }: HiddenNetworkProps) {
  const [essid, setEssid] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="CaptivePortal-password bp3-large bp3-text-large">
      <Label>
        ESSID:
        <input
          className="bp3-input"
          placeholder="Type ENTER to validate"
          value={essid}
          onChange={(ev) => setEssid(ev.currentTarget.value)}
          onKeyUp={(ev) => {
            if (ev.key === "Enter") {
              onValidate(ev.currentTarget.value, password as string);
            }
          }}
          autoFocus
        />
      </Label>
      <Label>
        Password:
        <input
          className="bp3-input"
          type="password"
          placeholder="Type ENTER to validate"
          value={password}
          onChange={(ev) => setPassword(ev.currentTarget.value)}
          onKeyUp={(ev) => {
            if (ev.key === "Enter") {
              onValidate(essid, ev.currentTarget.value);
            }
          }}
        />
      </Label>
    </div>
  );
}

const CaptivePortalToaster = Toaster.create({});

export default CaptivePortal;

module.exports = function GachaOpener(mod) {
    const { command } = mod;

    let enabled = false,
        contractId = 0,
        gachaDelay = 100,
        hookGacha;

    command.add("gacha", {
        delay(delay) {
            delay = parseInt(delay);
            if (isNaN(delay) || delay < 0) return command.message("Invalid delay.");
            gachaDelay = delay;
            command.message(`Gacha open delay set to ${gachaDelay}ms.`);
        },
        $default() {
            if (enabled) {
                if (contractId) {
                    mod.send("C_GACHA_CANCEL", 1, { id: contractId });
                }
                enabled = false;
                mod.unhook(hookGacha);
                command.message("Gacha opener disabled.");
            } else {
                enabled = true;
                command.message("Gacha opener enabled. Open a box manually and the script will continue opening it.")
            }
        }
    });

    mod.hook("S_REQUEST_CONTRACT", 1, event => {
        if (event.type === 53 && enabled) {
            contractId = event.id;

            mod.hookOnce("S_GACHA_START", "event", () => {
                return false;
            });

            command.message(`Starting to open boxes with delay set to ${gachaDelay}ms. Type !gacha or move to stop it.`);

            const cGachaTry = () => {
                if (!enabled) {
                    return;
                }

                mod.send("C_GACHA_TRY", 1, { id: contractId });
                hookGacha = mod.hookOnce("S_GACHA_END", "event", () => {
                    mod.setTimeout(cGachaTry, gachaDelay);
                    return false;
                });
            };
            mod.setTimeout(cGachaTry, gachaDelay);
            return false;
        }
    });

    mod.hook("S_CANCEL_CONTRACT", 1, event => {
        if (event.type === 53 && contractId) {
            if (enabled) {
                enabled = false;
                mod.unhook(hookGacha);
                command.message("You ran out of boxes or moved. Stopping...");
            }
            contractId = 0;
            return false;
        }
    });

    this.destructor = () => {
        command.remove(['gacha']);
    }
}
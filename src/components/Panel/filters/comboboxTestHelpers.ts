import { fireEvent, screen, within } from "@testing-library/react";

/**
 * Escolhe uma opção num `MultiSelectCombobox` de escolha única, como quem usa
 * a tela: abre a lista, clica na opção e fecha. Fechar aplica na hora o que o
 * combobox guardaria por 400 ms, então o teste não precisa de timers falsos.
 *
 * @example chooseComboboxOption(screen.getAllByLabelText("Ano")[0], "2020")
 */
export const chooseComboboxOption = (trigger: HTMLElement, option: string) => {
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: option }));
  fireEvent.click(trigger);
};

/**
 * Rótulos das opções na lista aberta do combobox `label` (a lista fecha
 * depois). Lê só o grupo da lista, não outros botões da página.
 *
 * @example comboboxOptions(screen.getAllByLabelText("Ano")[0], "Ano") // ["2023", "2022"]
 */
export const comboboxOptions = (
  trigger: HTMLElement,
  label: string,
): string[] => {
  fireEvent.click(trigger);
  const labels = within(screen.getByRole("group", { name: label }))
    .getAllByRole("button")
    .map((button) => button.textContent ?? "");

  fireEvent.click(trigger);

  return labels;
};

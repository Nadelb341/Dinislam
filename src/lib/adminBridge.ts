/**
 * Petits « ponts » pour ouvrir un écran du bouclier ou la messagerie admin depuis n'importe où
 * (ex. carte « À FAIRE » de l'accueil : transformer une tâche en devoir ou en message, ouvrir la fiche d'un élève).
 * Header.tsx écoute ces événements.
 */
export const OPEN_ADMIN_EVENT = 'dinislam:open-admin';
export const GROUP_MESSAGE_EVENT = 'dinislam:group-message';

export interface OpenAdminDetail { section: string; search?: string }
export interface GroupMessageDetail { groupIds: string[]; text: string }

export function openAdminSection(detail: OpenAdminDetail) {
  window.dispatchEvent(new CustomEvent<OpenAdminDetail>(OPEN_ADMIN_EVENT, { detail }));
}
export function openGroupMessage(detail: GroupMessageDetail) {
  window.dispatchEvent(new CustomEvent<GroupMessageDetail>(GROUP_MESSAGE_EVENT, { detail }));
}

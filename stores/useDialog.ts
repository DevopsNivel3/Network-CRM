interface DialogState {
  [key: string]: boolean;
}

export const useDialog = defineStore("dialog", {
  state: (): DialogState => ({
    change_password: false,
    create_lead: false,
    create_user: false,
    create_empresa: false,
    create_opportunity: false,
    create_opportunity_visita: false,
    edit_lead: false,
    edit_user: false,
    edit_empresa: false,
    edit_opportunity: false,
    view_lead: false,
    view_user: false,
    view_empresa: false,
    view_opportunity: false,
    view_opportunity_visita: false,
    end_opportunity_visita: false,
    cancel_opportunity_visita: false,
    reagendar_opportunity_visita: false,
  }),

  actions: {
    close(type: string) {
      if (this[type] !== undefined) {
        this[type] = false;
      }
    },
    open(type: string) {
      if (this[type] !== undefined) {
        this[type] = true;
      }
    },
    closeAll() {
      Object.keys(this.$state).forEach((key) => {
        this.$state[key] = false;
      });
    },
  },
});

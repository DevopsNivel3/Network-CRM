interface MenuState {
  state: {
    [key: string]: boolean;
  };
}

// Store para salvar os estados do Menu Mobile e do Sidebar/Drawer
export const useMenu = defineStore("menu", {
  state: (): MenuState => ({
    state: {
      mobile: false,
      sidebar: true,
    },
  }),
  actions: {
    openMenu(type: string) {
      if (this.state[type] !== undefined) {
        this.state[type] = true;
      }
    },
    closeMenu(type: string) {
      if (this.state[type] !== undefined) {
        this.state[type] = false;
      }
    },
    toggleMenu(type: string) {
      if (this.state[type] !== undefined) {
        this.state[type] = !this.state[type];
      }
    },
    closeAllMenu() {
      Object.keys(this.state).forEach((key) => {
        this.state[key] = false;
      });
    },
  },
});

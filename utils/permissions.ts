export enum UserPermissions {
  VER_LEAD = 1 << 0,
  VER_USUARIO = 1 << 1,
  VER_OPORTUNIDADE = 1 << 2,
  CRIAR_LEAD = 1 << 3,
  CRIAR_USUARIO = 1 << 4,
  CRIAR_OPORTUNIDADE = 1 << 5,
  EDITAR_LEAD = 1 << 6,
  EDITAR_USUARIO = 1 << 7,
  EDITAR_OPORTUNIDADE = 1 << 8,
  DELETAR_LEAD = 1 << 9,
  ADMIN = 1 << 10,
  GRANT_ADMIN = 1 << 11,
  CRIAR_VISITA = 1 << 12,
  VER_VISITA = 1 << 13,
  EDITAR_VISITA = 1 << 14,
  VER_RELATORIO = 1 << 15,
  GERENCIAR_RESPONSAVEIS = 1 << 16,
  CRIAR_GRUPO = 1 << 17,
  EDITAR_GRUPO = 1 << 18,
  DELETAR_GRUPO = 1 << 19,
  VER_GRUPO = 1 << 20,
  VER_FINANCEIRO = 1 << 21,
  VER_LOCALIZEIA = 1 << 22,
}

type PermissionKey = keyof typeof UserPermissions;
type PermissionGroupMap = Readonly<Record<string, readonly PermissionKey[]>>;

const adminPermissionGroups: PermissionGroupMap = {
  Usuários: ["VER_USUARIO", "CRIAR_USUARIO", "EDITAR_USUARIO"],
};

export const modulesConfig = {
  CRM: {
    groups: {
      Leads: ["VER_LEAD", "CRIAR_LEAD", "EDITAR_LEAD", "DELETAR_LEAD"],
      Oportunidades: [
        "VER_OPORTUNIDADE",
        "CRIAR_OPORTUNIDADE",
        "EDITAR_OPORTUNIDADE",
        "GERENCIAR_RESPONSAVEIS",
      ],
      Visitas: ["VER_VISITA", "CRIAR_VISITA", "EDITAR_VISITA"],
      Grupos: ["VER_GRUPO", "CRIAR_GRUPO", "EDITAR_GRUPO", "DELETAR_GRUPO"],
      Relatórios: ["VER_RELATORIO"],
    } as PermissionGroupMap,
  },
  FINANCEIRO: {
    groups: {
      Financeiro: ["VER_FINANCEIRO"],
    } as PermissionGroupMap,
  },
  LOCALIZEIA: {
    groups: {
      LocalizeIA: ["VER_LOCALIZEIA"],
    } as PermissionGroupMap,
  },
} as const satisfies Record<string, { groups: PermissionGroupMap }>;

export type Module = keyof typeof modulesConfig;

export const Modules = Object.freeze(
  Object.keys(modulesConfig).reduce(
    (acc, key) => {
      (acc as Record<string, string>)[key] = key;
      return acc;
    },
    {} as Record<Module, Module>,
  ),
);

export const allModules = Object.keys(modulesConfig) as Module[];

const validModuleSet = new Set<Module>(allModules);

export const normalizeModules = (modules?: unknown): Module[] => {
  if (modules == null) return [...allModules];

  let values: unknown[] = [];

  if (Array.isArray(modules)) {
    values = modules;
  } else if (typeof modules === "string") {
    const value = modules.trim();
    if (!value) return [...allModules];

    try {
      const parsed = JSON.parse(value);
      values = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      values = value.split(",");
    }
  } else if (typeof modules === "object") {
    values = Object.entries(modules)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([module]) => module);
  }

  const normalized = values
    .map((module) => String(module).trim().toUpperCase())
    .filter((module): module is Module => validModuleSet.has(module as Module));

  return Array.from(new Set(normalized));
};

export const getModuleOptions = () =>
  allModules.map((module) => ({
    value: module,
    label: module,
  }));

const toUniquePermissions = (groups: PermissionGroupMap) => {
  const set = new Set<PermissionKey>();
  Object.values(groups).forEach((permissions) => {
    permissions.forEach((permission) => set.add(permission));
  });
  return Array.from(set);
};

export const permissionModules = allModules.reduce(
  (acc, module) => {
    acc[module] = toUniquePermissions(modulesConfig[module].groups);
    return acc;
  },
  {} as Record<Module, PermissionKey[]>,
);

export type PermissionModule = Module;

export const allPermissionModules = allModules;

export const normalizePermissionModules = normalizeModules;

export const getPermissionModuleOptions = getModuleOptions;

const modulePermissionGroups = allModules.reduce(
  (acc, module) => {
    acc[module] = modulesConfig[module].groups;
    return acc;
  },
  {} as Record<Module, PermissionGroupMap>,
);

export const userPermissionsNames: {
  [key in keyof typeof UserPermissions]: string;
} = {
  VER_LEAD: "Visualizar Leads",
  VER_USUARIO: "Visualizar Usuários",
  VER_OPORTUNIDADE: "Visualizar Oportunidades",
  CRIAR_LEAD: "Criar Leads",
  CRIAR_USUARIO: "Criar Usuários",
  CRIAR_OPORTUNIDADE: "Criar Oportunidades",
  EDITAR_LEAD: "Editar Leads",
  EDITAR_USUARIO: "Editar Usuários",
  EDITAR_OPORTUNIDADE: "Editar Oportunidades",
  DELETAR_LEAD: "Excluir Leads",
  ADMIN: "Administrador",
  GRANT_ADMIN: "Administrador Geral",
  CRIAR_VISITA: "Agendar visitas",
  VER_VISITA: "Visualizar visitas",
  EDITAR_VISITA: "Editar visitas",
  VER_RELATORIO: "Visualizar Relatórios",
  GERENCIAR_RESPONSAVEIS: "Gerenciar Responsáveis",
  CRIAR_GRUPO: "Criar Grupos",
  EDITAR_GRUPO: "Editar Grupos",
  DELETAR_GRUPO: "Excluir Grupos",
  VER_GRUPO: "Visualizar Grupos",
  VER_FINANCEIRO: "Visualizar Financeiro",
  VER_LOCALIZEIA: "Visualizar LocalizeIA",
};

// Retorna todos os nomes das permissões
export const getUserPermissionsNames = (userPermissions: number) => {
  const permissions = [];

  for (const [key, value] of Object.entries(UserPermissions))
    if (typeof value === "number" && (userPermissions & value) === value)
      permissions.push(
        userPermissionsNames[key as keyof typeof UserPermissions],
      );

  return permissions;
};

// Retorna as permissões em bitfield do usuário
export const getUserPermissionsBitfield = (userPermissions: number) => {
  const permissions = [];

  for (const [_, value] of Object.entries(UserPermissions))
    if (typeof value === "number" && (userPermissions & value) === value)
      permissions.push(value);

  return permissions;
};

// Retorna todas as permissões em grupos para o select
export const getGroupedPermissionsSelectOptions = () => {
  const moduleOptions = Object.entries(modulePermissionGroups).map(
    ([moduleLabel, groupMap]) => ({
      label: moduleLabel,
      options: Object.entries(groupMap).map(([groupLabel, keys]) => ({
        label: groupLabel,
        options: keys
          .filter((key) => key !== "GRANT_ADMIN")
          .map((key) => ({
            value: UserPermissions[key],
            label: userPermissionsNames[key],
          })),
      })),
    }),
  );

  const adminOptions = {
    label: "Administração",
    options: [
      ...Object.entries(adminPermissionGroups).map(([groupLabel, keys]) => ({
        label: groupLabel,
        options: keys.map((key) => ({
          value: UserPermissions[key],
          label: userPermissionsNames[key],
        })),
      })),
      {
        label: "Administração",
        options: [
          {
            value: UserPermissions.ADMIN,
            label: userPermissionsNames.ADMIN,
          },
        ],
      },
    ],
  };

  return [...moduleOptions, adminOptions];
};

const getPermissionShortLabel = (key: keyof typeof UserPermissions) => {
  if (key === "GERENCIAR_RESPONSAVEIS") return "Gerenciar responsáveis";
  if (key === "CRIAR_VISITA") return "Agendar";
  if (key.startsWith("VER_")) return "Visualizar";
  if (key.startsWith("CRIAR_")) return "Criar";
  if (key.startsWith("EDITAR_")) return "Editar";
  if (key.startsWith("DELETAR_")) return "Deletar";
  if (key === "ADMIN") return "Administrador";
  if (key === "GRANT_ADMIN") return "Administrador geral";
  return userPermissionsNames[key];
};

export const getUserPermissionsActionNames = (userPermissions: number) => {
  const names = new Set<string>();

  for (const [key, value] of Object.entries(UserPermissions)) {
    if (typeof value !== "number") continue;
    if ((userPermissions & value) !== value) continue;
    names.add(getPermissionShortLabel(key as keyof typeof UserPermissions));
  }

  return Array.from(names);
};

export const getUserPermissionsByModule = (userPermissions: number) => {
  const moduleSections = Object.entries(modulePermissionGroups)
    .map(([moduleLabel, groupMap]) => {
      const groups = Object.entries(groupMap)
        .map(([groupLabel, keys]) => {
          const actions = keys
            .filter((key) => key !== "GRANT_ADMIN")
            .filter(
              (key) =>
                (userPermissions & UserPermissions[key]) ===
                UserPermissions[key],
            )
            .map((key) => getPermissionShortLabel(key));
          return actions.length ? { label: groupLabel, actions } : null;
        })
        .filter(Boolean) as { label: string; actions: string[] }[];

      return groups.length ? { label: moduleLabel, groups } : null;
    })
    .filter(Boolean) as {
    label: string;
    groups: { label: string; actions: string[] }[];
  }[];

  const adminGroups = Object.entries(adminPermissionGroups)
    .map(([groupLabel, keys]) => {
      const actions = keys
        .filter(
          (key) =>
            (userPermissions & UserPermissions[key]) === UserPermissions[key],
        )
        .map((key) => getPermissionShortLabel(key));
      return actions.length ? { label: groupLabel, actions } : null;
    })
    .filter(Boolean) as { label: string; actions: string[] }[];

  const adminActions = [
    (userPermissions & UserPermissions.ADMIN) === UserPermissions.ADMIN
      ? getPermissionShortLabel("ADMIN")
      : null,
  ].filter(Boolean) as string[];

  if (adminActions.length) {
    adminGroups.push({ label: "Administração", actions: adminActions });
  }

  if (adminGroups.length) {
    moduleSections.push({ label: "Administração", groups: adminGroups });
  }

  return moduleSections;
};

const getAdminTreeNode = () => {
  const groupNodes = Object.entries(adminPermissionGroups).map(
    ([groupLabel, keys]) => ({
      key: `group-ADMIN-${groupLabel}`,
      label: groupLabel,
      children: keys
        .filter((key) => key !== "GRANT_ADMIN")
        .map((key) => ({
          key: UserPermissions[key],
          label: getPermissionShortLabel(key),
        })),
    }),
  );

  return {
    key: "module-ADMIN",
    label: "Administração",
    children: [
      ...groupNodes,
      {
        key: UserPermissions.ADMIN,
        label: getPermissionShortLabel("ADMIN"),
      },
    ],
  };
};

export const getPermissionsTreeData = () => {
  const moduleNodes = Object.entries(modulePermissionGroups).map(
    ([moduleLabel, groupMap]) => {
      const moduleKey = `module-${moduleLabel}`;
      const groupNodes = Object.entries(groupMap).map(([groupLabel, keys]) => ({
        key: `group-${moduleLabel}-${groupLabel}`,
        label: groupLabel,
        children: keys
          .filter((key) => key !== "GRANT_ADMIN")
          .map((key) => ({
            key: UserPermissions[key],
            label: getPermissionShortLabel(key),
          })),
      }));

      return {
        key: moduleKey,
        label: moduleLabel,
        children: groupNodes,
      };
    },
  );

  return [...moduleNodes, getAdminTreeNode()];
};

export const getPermissionsTreeDataByModules = (
  modules?: PermissionModule[] | null,
) => {
  const allowed = new Set(normalizePermissionModules(modules));
  return getPermissionsTreeData().filter((moduleNode) => {
    const moduleKey = String(moduleNode.key).replace("module-", "");
    if (moduleKey === "ADMIN") return true;
    return allowed.has(moduleKey as PermissionModule);
  });
};

export const getPermissionsBitfieldForModules = (
  modules?: PermissionModule[] | null,
) => {
  const allowedModules = normalizePermissionModules(modules);
  const allowedKeys = new Set<string>();

  allowedModules.forEach((module) => {
    permissionModules[module].forEach((key) => allowedKeys.add(key));
  });

  let bitfield = 0;
  allowedKeys.forEach((key) => {
    bitfield |= UserPermissions[key as keyof typeof UserPermissions];
  });

  return bitfield;
};

const getNonModulePermissionsBitfield = () => {
  const moduleBitfield = getPermissionsBitfieldForModules(allPermissionModules);
  let nonModuleBitfield = 0;
  for (const [_, value] of Object.entries(UserPermissions)) {
    if (typeof value !== "number") continue;
    if ((moduleBitfield & value) !== value) nonModuleBitfield |= value;
  }
  return nonModuleBitfield;
};

export const getAllowedPermissionsBitfield = (
  modules?: PermissionModule[] | null,
) =>
  getPermissionsBitfieldForModules(modules) | getNonModulePermissionsBitfield();

export const filterPermissionKeysByModules = (
  permissionKeys: number[] | null | undefined,
  modules?: PermissionModule[] | null,
) => {
  if (!permissionKeys || !permissionKeys.length) return [];
  const allowedBitfield = getPermissionsBitfieldForModules(modules);
  const nonModuleBitfield = getNonModulePermissionsBitfield();
  return permissionKeys.filter((permission) => {
    if ((permission & nonModuleBitfield) === permission) return true;
    return (permission & allowedBitfield) === permission;
  });
};

// Faz a soma das permissões para salvar
export function grantUserPermission(...permissions: UserPermissions[]): number {
  return permissions.reduce((result, permission) => result | permission, 0);
}

// Verifica se o usuário tem permissão
export function hasUserPermission(
  userPermissions: number,
  requiredPermission: UserPermissions,
): boolean {
  if (userPermissions & UserPermissions.GRANT_ADMIN) return true;
  if (
    userPermissions & UserPermissions.ADMIN &&
    requiredPermission !== UserPermissions.GRANT_ADMIN
  )
    return true;
  return (userPermissions & requiredPermission) === requiredPermission;
}

// Remove permissão do usuário
export function removeUserPermission(
  userPermissions: number,
  permissionToRemove: UserPermissions,
): number {
  return userPermissions & ~permissionToRemove;
}

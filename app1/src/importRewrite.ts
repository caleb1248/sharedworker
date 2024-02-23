import type { NodePath, PluginObj, PluginPass } from '@babel/core';
import t from '@babel/types';

type ReplaceFunc = (source: string, file: string, opts: any) => string;
function getReplaceFunc({ replaceFunc }: { replaceFunc: ReplaceFunc }) {
  return replaceFunc;
}

const importRewrite: () => PluginObj = () => {
  let cachedReplaceFunction: ReplaceFunc;

  function mapModule(source: string, file: string, state: { opts: any }) {
    const opts = state.opts;
    if (!cachedReplaceFunction) {
      cachedReplaceFunction = getReplaceFunc(opts);
    }
    const replace = cachedReplaceFunction;
    const result = replace(source, file, opts);
    if (result !== source) {
      return result;
    } else {
      return;
    }
  }

  function transformRequireCall(
    nodePath: NodePath<t.CallExpression>,
    state: PluginPass
  ) {
    if (
      !t.isIdentifier(nodePath.node.callee, { name: 'require' }) &&
      !(
        t.isMemberExpression(nodePath.node.callee) &&
        t.isIdentifier(nodePath.node.callee.object, { name: 'require' })
      )
    ) {
      return;
    }

    const moduleArg = nodePath.node.arguments[0];
    if (moduleArg && moduleArg.type === 'StringLiteral') {
      const modulePath = mapModule(
        moduleArg.value,
        state.file.opts.filename!,
        state
      );
      if (modulePath) {
        nodePath.replaceWith(
          t.callExpression(nodePath.node.callee, [t.stringLiteral(modulePath)])
        );
      }
    }
  }

  function transformImportExportCall(
    nodePath: NodePath<t.ImportDeclaration> | NodePath<t.ExportDeclaration>,
    state: PluginPass
  ) {
    // @ts-expect-error
    const moduleArg = nodePath.node.source;
    if (moduleArg && moduleArg.type === 'StringLiteral') {
      const modulePath = mapModule(
        moduleArg.value,
        state.file.opts.filename!,
        state
      );
      if (modulePath) {
        // @ts-expect-error
        nodePath.node.source = t.stringLiteral(modulePath);
      }
    }
  }

  return {
    visitor: {
      CallExpression: {
        exit(nodePath, state) {
          return transformRequireCall(nodePath, state);
        },
      },
      ImportDeclaration: {
        exit(nodePath, state) {
          return transformImportExportCall(nodePath, state);
        },
      },
      ExportDeclaration: {
        exit(nodePath, state) {
          return transformImportExportCall(nodePath, state);
        },
      },
    },
  };
};

export default importRewrite;

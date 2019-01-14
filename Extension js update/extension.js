"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const peripheral_1 = require("./peripheral");
const registers_1 = require("./registers");
const core_1 = require("./swo/core");
const common_1 = require("../common");
const memory_content_provider_1 = require("./memory_content_provider");
const reporting_1 = require("../reporting");
const CopyPaste = require("copy-paste");
const configprovider_1 = require("./configprovider");
const socket_1 = require("./swo/sources/socket");
const fifo_1 = require("./swo/sources/fifo");
const file_1 = require("./swo/sources/file");
const serial_1 = require("./swo/sources/serial");
const disassembly_content_provider_1 = require("./disassembly_content_provider");
const symbols_1 = require("../symbols");
class CortexDebugExtension {
    constructor(context) {
        this.context = context;
        this.adapterOutputChannel = null;
        this.swo = null;
        this.swosource = null;
        this.SVDDirectory = [];
        this.functionSymbols = null;
        this.peripheralProvider = new peripheral_1.PeripheralTreeProvider();
        this.registerProvider = new registers_1.RegisterTreeProvider();
        this.memoryProvider = new memory_content_provider_1.MemoryContentProvider();
        let tmp = [];
		var firstcnt = 0;
        try {
            const dirPath = path.join(context.extensionPath, 'data', 'SVDMap.json');
            tmp = JSON.parse(fs.readFileSync(dirPath, 'utf8'));
        }
        catch (e) { }
        this.SVDDirectory = tmp.map((de) => {
            let exp = null;
            if (de.id) {
                exp = new RegExp('^' + de.id + '$', '');
            }
            else {
                exp = new RegExp(de.expression, de.flags);
            }
            return { expression: exp, path: de.path };
        });
        reporting_1.default.activate(context);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('examinememory', this.memoryProvider), vscode.workspace.registerTextDocumentContentProvider('disassembly', new disassembly_content_provider_1.DisassemblyContentProvider()), vscode.commands.registerCommand('cortex-debug.peripherals.updateNode', this.peripheralsUpdateNode.bind(this)), vscode.commands.registerCommand('cortex-debug.peripherals.selectedNode', this.peripheralsSelectedNode.bind(this)), vscode.commands.registerCommand('cortex-debug.peripherals.copyValue', this.peripheralsCopyValue.bind(this)), vscode.commands.registerCommand('cortex-debug.peripherals.setFormat', this.peripheralsSetFormat.bind(this)), vscode.commands.registerCommand('cortex-debug.registers.selectedNode', this.registersSelectedNode.bind(this)), vscode.commands.registerCommand('cortex-debug.registers.copyValue', this.registersCopyValue.bind(this)), vscode.commands.registerCommand('cortex-debug.registers.setFormat', this.registersSetFormat.bind(this)), vscode.commands.registerCommand('cortex-debug.examineMemory', this.examineMemory.bind(this)), vscode.commands.registerCommand('cortex-debug.viewDisassembly', this.showDisassembly.bind(this)), vscode.commands.registerCommand('cortex-debug.setForceDisassembly', this.setForceDisassembly.bind(this)), vscode.window.registerTreeDataProvider('cortex-debug.peripherals', this.peripheralProvider), vscode.window.registerTreeDataProvider('cortex-debug.registers', this.registerProvider), vscode.debug.onDidReceiveDebugSessionCustomEvent(this.receivedCustomEvent.bind(this)), vscode.debug.onDidStartDebugSession(this.debugSessionStarted.bind(this)), vscode.debug.onDidTerminateDebugSession(this.debugSessionTerminated.bind(this)), vscode.window.onDidChangeActiveTextEditor(this.activeEditorChanged.bind(this)), vscode.window.onDidChangeTextEditorSelection((e) => {
            if (e && e.textEditor.document.fileName.endsWith('.cdmem')) {
                this.memoryProvider.handleSelection(e);
            }
        }), vscode.debug.registerDebugConfigurationProvider('jlink-gdb', new configprovider_1.DeprecatedDebugConfigurationProvider(context, 'jlink')), vscode.debug.registerDebugConfigurationProvider('openocd-gdb', new configprovider_1.DeprecatedDebugConfigurationProvider(context, 'openocd')), vscode.debug.registerDebugConfigurationProvider('stutil-gdb', new configprovider_1.DeprecatedDebugConfigurationProvider(context, 'stutil')), vscode.debug.registerDebugConfigurationProvider('pyocd-gdb', new configprovider_1.DeprecatedDebugConfigurationProvider(context, 'pyocd')), vscode.debug.registerDebugConfigurationProvider('cortex-debug', new configprovider_1.CortexDebugConfigurationProvider(context)));
    }
    getSVDFile(device) {
        const entry = this.SVDDirectory.find((de) => de.expression.test(device));
        return entry ? entry.path : null;
    }
    activeEditorChanged(editor) {
        if (editor !== undefined && vscode.debug.activeDebugSession && vscode.debug.activeDebugSession.type === 'cortex-debug') {
            const uri = editor.document.uri;
            if (uri.scheme === 'file') {
               if(firstcnt == 0) vscode.debug.activeDebugSession.customRequest('set-active-editor', { path: uri.path });
			   firstcnt++;
            }
            else if (uri.scheme === 'disassembly') {
                vscode.debug.activeDebugSession.customRequest('set-active-editor', { path: `${uri.scheme}://${uri.authority}${uri.path}` });
            }
        }
    }
    showDisassembly() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.debug.activeDebugSession) {
                vscode.window.showErrorMessage('No debugging session available');
                return;
            }
            if (!this.functionSymbols) {
                try {
                    const resp = yield vscode.debug.activeDebugSession.customRequest('load-function-symbols');
                    this.functionSymbols = resp.functionSymbols;
                }
                catch (e) {
                    vscode.window.showErrorMessage('Unable to load symbol table. Disassembly view unavailable.');
                }
            }
            try {
                const funcname = yield vscode.window.showInputBox({
                    placeHolder: 'main',
                    ignoreFocusOut: true,
                    prompt: 'Function Name to Disassemble'
                });
                const functions = this.functionSymbols.filter((s) => s.name === funcname);
                let url;
                if (functions.length === 0) {
                    vscode.window.showErrorMessage(`No function with name ${funcname} found.`);
                }
                else if (functions.length === 1) {
                    if (functions[0].scope === symbols_1.SymbolScope.Global) {
                        url = `disassembly:///${functions[0].name}.cdasm`;
                    }
                    else {
                        url = `disassembly:///${functions[0].file}::${functions[0].name}.cdasm`;
                    }
                }
                else {
                    const selected = yield vscode.window.showQuickPick(functions.map((f) => {
                        return {
                            label: f.name,
                            name: f.name,
                            file: f.file,
                            scope: f.scope,
                            description: f.scope === symbols_1.SymbolScope.Global ? 'Global Scope' : `Static in ${f.file}`
                        };
                    }), {
                        ignoreFocusOut: true
                    });
                    if (selected.scope === symbols_1.SymbolScope.Global) {
                        url = `disassembly:///${selected.name}.cdasm`;
                    }
                    else {
                        url = `disassembly:///${selected.file}::${selected.name}.cdasm`;
                    }
                }
                vscode.window.showTextDocument(vscode.Uri.parse(url));
            }
            catch (e) {
                vscode.window.showErrorMessage('Unable to show disassembly.');
            }
        });
    }
    setForceDisassembly() {
        vscode.window.showQuickPick([
            { label: 'Auto', description: 'Show disassembly for functions when source cannot be located.' },
            { label: 'Forced', description: 'Always show disassembly for functions.' }
        ], { matchOnDescription: true, ignoreFocusOut: true }).then((result) => {
            const force = result.label === 'Forced';
            vscode.debug.activeDebugSession.customRequest('set-force-disassembly', { force: force });
            reporting_1.default.sendEvent('Force Disassembly', 'Set', force ? 'Forced' : 'Auto');
        }, (error) => { });
    }
    examineMemory() {
        function validateValue(address) {
            if (/^0x[0-9a-f]{1,8}$/i.test(address)) {
                return address;
            }
            else if (/^[0-9]+$/i.test(address)) {
                return address;
            }
            else {
                return null;
            }
        }
        if (!vscode.debug.activeDebugSession) {
            vscode.window.showErrorMessage('No debugging session available');
            return;
        }
        vscode.window.showInputBox({
            placeHolder: 'Prefix with 0x for hexidecimal format',
            ignoreFocusOut: true,
            prompt: 'Memory Address'
        }).then((address) => {
            if (!validateValue(address)) {
                vscode.window.showErrorMessage('Invalid memory address entered');
                reporting_1.default.sendEvent('Examine Memory', 'Invalid Address', address);
                return;
            }
            vscode.window.showInputBox({
                placeHolder: 'Prefix with 0x for hexidecimal format',
                ignoreFocusOut: true,
                prompt: 'Length'
            }).then((length) => {
                if (!validateValue(length)) {
                    vscode.window.showErrorMessage('Invalid length entered');
                    reporting_1.default.sendEvent('Examine Memory', 'Invalid Length', length);
                    return;
                }
                reporting_1.default.sendEvent('Examine Memory', 'Valid', `${address}-${length}`);
                const timestamp = new Date().getTime();
                // tslint:disable-next-line:max-line-length
                vscode.workspace.openTextDocument(vscode.Uri.parse(`examinememory:///Memory%20[${address}+${length}].cdmem?address=${address}&length=${length}&timestamp=${timestamp}`))
                    .then((doc) => {
                    vscode.window.showTextDocument(doc, { viewColumn: 2, preview: false });
                    reporting_1.default.sendEvent('Examine Memory', 'Used');
                }, (error) => {
                    vscode.window.showErrorMessage(`Failed to examine memory: ${error}`);
                    reporting_1.default.sendEvent('Examine Memory', 'Error', error.toString());
                });
            }, (error) => {
            });
        }, (error) => {
        });
    }
    // Peripherals
    peripheralsUpdateNode(node) {
        node.node.performUpdate().then((result) => {
            if (result) {
                this.peripheralProvider.refresh();
                reporting_1.default.sendEvent('Peripheral View', 'Update Node');
            }
        }, (error) => {
            vscode.window.showErrorMessage(`Unable to update value: ${error.toString()}`);
        });
    }
    peripheralsSelectedNode(node) {
        if (node.recordType !== peripheral_1.RecordType.Field) {
            node.expanded = !node.expanded;
        }
        node.selected().then((updated) => {
            if (updated) {
                this.peripheralProvider.refresh();
            }
        }, (error) => { });
    }
    peripheralsCopyValue(tn) {
        const cv = tn.node.getCopyValue();
        if (cv) {
            CopyPaste.copy(cv);
            reporting_1.default.sendEvent('Peripheral View', 'Copy Value');
        }
    }
    peripheralsSetFormat(tn) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showQuickPick([
                { label: 'Auto', description: 'Automatically choose format (Inherits from parent)', value: common_1.NumberFormat.Auto },
                { label: 'Hex', description: 'Format value in hexidecimal', value: common_1.NumberFormat.Hexidecimal },
                { label: 'Decimal', description: 'Format value in decimal', value: common_1.NumberFormat.Decimal },
                { label: 'Binary', description: 'Format value in binary', value: common_1.NumberFormat.Binary }
            ]);
            tn.node.setFormat(result.value);
            this.peripheralProvider.refresh();
            reporting_1.default.sendEvent('Peripheral View', 'Set Format', result.label);
        });
    }
    // Registers
    registersSelectedNode(node) {
        if (node.recordType !== registers_1.RecordType.Field) {
            node.expanded = !node.expanded;
        }
    }
    registersCopyValue(tn) {
        const cv = tn.node.getCopyValue();
        if (cv) {
            CopyPaste.copy(cv);
            reporting_1.default.sendEvent('Register View', 'Update Node');
        }
    }
    registersSetFormat(tn) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showQuickPick([
                { label: 'Auto', description: 'Automatically choose format (Inherits from parent)', value: common_1.NumberFormat.Auto },
                { label: 'Hex', description: 'Format value in hexidecimal', value: common_1.NumberFormat.Hexidecimal },
                { label: 'Decimal', description: 'Format value in decimal', value: common_1.NumberFormat.Decimal },
                { label: 'Binary', description: 'Format value in binary', value: common_1.NumberFormat.Binary }
            ]);
            tn.node.setFormat(result.value);
            this.registerProvider.refresh();
            reporting_1.default.sendEvent('Register View', 'Set Format', result.label);
        });
    }
    // Debug Events
    debugSessionStarted(session) {
        if (session.type !== 'cortex-debug') {
            return;
        }
        // Clean-up Old output channels
        if (this.swo) {
            this.swo.dispose();
            this.swo = null;
        }
        this.functionSymbols = null;
        session.customRequest('get-arguments').then((args) => {
            let svdfile = args.svdFile;
            if (!svdfile) {
                const basepath = this.getSVDFile(args.device);
                if (basepath) {
                    svdfile = path.join(this.context.extensionPath, basepath);
                }
            }
            reporting_1.default.beginSession(args);
            this.registerProvider.debugSessionStarted();
            this.peripheralProvider.debugSessionStarted(svdfile ? svdfile : null);
            if (this.swosource) {
                this.initializeSWO(args);
            }
        }, (error) => {
            // TODO: Error handling for unable to get arguments
        });
    }
    debugSessionTerminated(session) {
        if (session.type !== 'cortex-debug') {
            return;
        }
        reporting_1.default.endSession();
        this.registerProvider.debugSessionTerminated();
        this.peripheralProvider.debugSessionTerminated();
        if (this.swo) {
            this.swo.debugSessionTerminated();
        }
        if (this.swosource) {
            this.swosource.dispose();
            this.swosource = null;
        }
    }
    receivedCustomEvent(e) {
        if (vscode.debug.activeDebugSession && vscode.debug.activeDebugSession.type !== 'cortex-debug') {
            return;
        }
        switch (e.event) {
            case 'custom-stop':
                this.receivedStopEvent(e);
                break;
            case 'custom-continued':
                this.receivedContinuedEvent(e);
                break;
            case 'swo-configure':
                this.receivedSWOConfigureEvent(e);
                break;
            case 'adapter-output':
                this.receivedAdapterOutput(e);
                break;
            case 'record-event':
                this.receivedEvent(e);
                break;
            default:
                break;
        }
    }
    receivedStopEvent(e) {
        this.peripheralProvider.debugStopped();
        this.registerProvider.debugStopped();
        vscode.workspace.textDocuments.filter((td) => td.fileName.endsWith('.cdmem'))
            .forEach((doc) => { this.memoryProvider.update(doc); });
        if (this.swo) {
            this.swo.debugStopped();
        }
    }
    receivedContinuedEvent(e) {
        this.peripheralProvider.debugContinued();
        this.registerProvider.debugContinued();
        if (this.swo) {
            this.swo.debugContinued();
        }
    }
    receivedEvent(e) {
        reporting_1.default.sendEvent(e.body.category, e.body.action, e.body.label, e.body.parameters);
    }
    receivedSWOConfigureEvent(e) {
        if (e.body.type === 'socket') {
            this.swosource = new socket_1.SocketSWOSource(e.body.port);
            reporting_1.default.sendEvent('SWO', 'Source', 'Socket');
        }
        else if (e.body.type === 'fifo') {
            this.swosource = new fifo_1.FifoSWOSource(e.body.path);
            reporting_1.default.sendEvent('SWO', 'Source', 'FIFO');
        }
        else if (e.body.type === 'file') {
            this.swosource = new file_1.FileSWOSource(e.body.path);
            reporting_1.default.sendEvent('SWO', 'Source', 'File');
        }
        else if (e.body.type === 'serial') {
            this.swosource = new serial_1.SerialSWOSource(e.body.device, e.body.baudRate, this.context.extensionPath);
            reporting_1.default.sendEvent('SWO', 'Source', 'Serial');
        }
        if (vscode.debug.activeDebugSession) {
            vscode.debug.activeDebugSession.customRequest('get-arguments').then((args) => {
                this.initializeSWO(args);
            });
        }
    }
    receivedAdapterOutput(e) {
        if (!this.adapterOutputChannel) {
            this.adapterOutputChannel = vscode.window.createOutputChannel('Adapter Output');
        }
        let output = e.body.content;
        if (!output.endsWith('\n')) {
            output += '\n';
        }
        this.adapterOutputChannel.append(output);
    }
    initializeSWO(args) {
        if (!this.swosource) {
            vscode.window.showErrorMessage('Tried to initialize SWO Decoding without a SWO data source');
            return;
        }
        this.swo = new core_1.SWOCore(this.swosource, args, this.context.extensionPath);
    }
}
function activate(context) {
    const extension = new CortexDebugExtension(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
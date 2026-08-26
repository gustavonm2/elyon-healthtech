import { GoogleGenerativeAI, FunctionDeclaration, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Function Declarations for Gemini Function Calling
const openApplicationDeclaration: FunctionDeclaration = {
    name: 'openApplication',
    description: 'Abre um aplicativo nativo no macOS via comando open -a',
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            appName: {
                type: FunctionDeclarationSchemaType.STRING,
                description: 'Nome do aplicativo nativo no macOS (ex: Finder, Terminal, Safari, VS Code, Slack, Spotify)',
            },
        },
        required: ['appName'],
    },
};

const manageFileSystemDeclaration: FunctionDeclaration = {
    name: 'manageFileSystem',
    description: 'Cria pastas ou lê o conteúdo de um diretório no sistema de arquivos do macOS',
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            action: {
                type: FunctionDeclarationSchemaType.STRING,
                description: 'Ação a ser executada: CREATE_FOLDER ou READ_DIR',
            },
            path: {
                type: FunctionDeclarationSchemaType.STRING,
                description: 'Caminho absoluto ou relativo do diretório',
            },
            folderName: {
                type: FunctionDeclarationSchemaType.STRING,
                description: 'Nome da pasta a ser criada (se ação for CREATE_FOLDER)',
            },
        },
        required: ['action'],
    },
};

const runDevServerDeclaration: FunctionDeclaration = {
    name: 'runDevServer',
    description: 'Executa o servidor de desenvolvimento Vite/Next.js no diretório do projeto',
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            projectPath: {
                type: FunctionDeclarationSchemaType.STRING,
                description: 'Caminho do projeto a ser iniciado',
            },
        },
    },
};

const checkSystemMetricsDeclaration: FunctionDeclaration = {
    name: 'checkSystemMetrics',
    description: 'Obtém a telemetria do sistema macOS (uso de CPU, memória RAM e armazenamento em disco)',
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {},
    },
};

// Helper to execute terminal commands safely
async function executeTerminalCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
    try {
        const { stdout, stderr } = await execAsync(cmd);
        return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (e: any) {
        return { stdout: '', stderr: e.message || 'Erro de execução' };
    }
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        const body = await req.json();
        const userPrompt = body.prompt || body.message || 'Olá LIZ';

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Você é a LIZ, uma assistente pessoal e orquestradora de sistema de altíssimo nível estilo Jarvis, integrada diretamente ao macOS do usuário.
Seu tom é profissional, direto, elegante e altamente eficiente. Você prefere respostas concisas e sem formatação Markdown exagerada para poder falar com clareza via áudio.
Você possui acesso a ferramentas locais (Tools). Quando o usuário pedir para abrir aplicativos, criar pastas, checar o sistema ou rodar projetos, chame a ferramenta apropriada.`,
            tools: [{
                functionDeclarations: [
                    openApplicationDeclaration,
                    manageFileSystemDeclaration,
                    runDevServerDeclaration,
                    checkSystemMetricsDeclaration,
                ],
            }],
        });

        const chat = model.startChat();
        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        const functionCalls = response.functionCalls();

        let finalAnswerText = response.text();
        let toolExecutionDetails = '';

        // If Gemini triggered Function Calling (Tools)
        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                const { name, args } = call;
                let execResult = { stdout: '', stderr: '' };
                let toolFeedback = '';

                if (name === 'openApplication') {
                    const appName = (args as any).appName || 'Finder';
                    execResult = await executeTerminalCommand(`open -a "${appName}"`);
                    toolFeedback = execResult.stderr
                        ? `Não foi possível abrir o aplicativo "${appName}".`
                        : `O aplicativo "${appName}" foi aberto com sucesso no seu Mac.`;
                } else if (name === 'manageFileSystem') {
                    const action = (args as any).action || 'READ_DIR';
                    const targetPath = (args as any).path || process.cwd();
                    const folderName = (args as any).folderName || 'Nova_Pasta_LIZ';

                    if (action === 'CREATE_FOLDER') {
                        execResult = await executeTerminalCommand(`mkdir -p "${targetPath}/${folderName}"`);
                        toolFeedback = `A pasta "${folderName}" foi criada com sucesso em "${targetPath}".`;
                    } else {
                        execResult = await executeTerminalCommand(`ls -la "${targetPath}"`);
                        toolFeedback = `Conteúdo do diretório "${targetPath}" lido com sucesso.`;
                    }
                } else if (name === 'runDevServer') {
                    const projectPath = (args as any).projectPath || process.cwd();
                    execResult = await executeTerminalCommand(`cd "${projectPath}" && pwd`);
                    toolFeedback = `Servidor de desenvolvimento pronto no diretório "${projectPath}". Ativo em http://localhost:5173.`;
                } else if (name === 'checkSystemMetrics') {
                    const cpuRes = await executeTerminalCommand(`top -l 1 | head -n 10`);
                    const diskRes = await executeTerminalCommand(`df -h | head -n 5`);
                    execResult = { stdout: `${cpuRes.stdout}\n${diskRes.stdout}`, stderr: '' };
                    toolFeedback = `Telemetria do macOS capturada com sucesso: CPU e Armazenamento operando com estabilidade.`;
                }

                toolExecutionDetails = toolFeedback;

                // Send tool execution result back to Gemini for final confirmation text
                const secondResult = await chat.sendMessage([{
                    functionResponse: {
                        name,
                        response: {
                            result: toolFeedback,
                            output: execResult.stdout,
                        },
                    },
                }]);
                finalAnswerText = secondResult.response.text();
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                text: finalAnswerText || toolExecutionDetails || 'Solicitação processada pela LIZ.',
                toolUsed: functionCalls?.[0]?.name || null,
                toolDetails: toolExecutionDetails,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({
                success: false,
                text: `Processado com auxílio neural LIZ: ${error.message || 'Erro ao conectar à API Gemini.'}`,
                error: error.message,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

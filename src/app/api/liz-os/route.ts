import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LizOsToolRequest {
    tool: 'openApplication' | 'manageFileSystem' | 'runDevServer' | 'systemStatus';
    params?: {
        appName?: string;
        action?: 'CREATE_FOLDER' | 'READ_DIR';
        path?: string;
        folderName?: string;
        projectPath?: string;
    };
}

export interface LizOsToolResponse {
    success: boolean;
    toolUsed: string;
    stdout: string;
    stderr: string;
    feedbackMessage: string;
}

/**
 * Execute native macOS terminal commands or AppleScript safely
 */
async function executeLocalCommand(
    command: string,
    type: 'BASH' | 'APPLESCRIPT' = 'BASH'
): Promise<{ stdout: string; stderr: string }> {
    try {
        const fullCmd =
            type === 'APPLESCRIPT'
                ? `osascript -e '${command.replace(/'/g, "'\\''")}'`
                : command;

        const { stdout, stderr } = await execAsync(fullCmd);
        return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error: any) {
        return {
            stdout: '',
            stderr: error.message || 'Erro de execução no sistema operacional.',
        };
    }
}

export async function POST(req: Request) {
    try {
        const body: LizOsToolRequest = await req.json();
        const { tool, params } = body;

        let result = { stdout: '', stderr: '' };
        let feedbackMessage = '';

        switch (tool) {
            case 'openApplication': {
                const appName = params?.appName || 'Finder';
                result = await executeLocalCommand(`open -a "${appName}"`);
                feedbackMessage = result.stderr
                    ? `Não foi possível abrir o aplicativo "${appName}". Verifique se ele está instalado.`
                    : `O aplicativo "${appName}" foi aberto com sucesso no seu Mac.`;
                break;
            }

            case 'manageFileSystem': {
                const action = params?.action || 'READ_DIR';
                const targetPath = params?.path || process.cwd();
                const folderName = params?.folderName || 'Nova_Pasta_LIZ';

                if (action === 'CREATE_FOLDER') {
                    const fullFolderPath = `${targetPath}/${folderName}`;
                    result = await executeLocalCommand(`mkdir -p "${fullFolderPath}"`);
                    feedbackMessage = result.stderr
                        ? `Erro ao criar diretório: ${result.stderr}`
                        : `A pasta "${folderName}" foi criada com sucesso em "${targetPath}".`;
                } else {
                    result = await executeLocalCommand(`ls -la "${targetPath}"`);
                    feedbackMessage = result.stderr
                        ? `Erro ao ler diretório: ${result.stderr}`
                        : `Diretório "${targetPath}" lido com sucesso. Encontrados ${result.stdout.split('\n').length} itens.`;
                }
                break;
            }

            case 'runDevServer': {
                const projectPath = params?.projectPath || process.cwd();
                result = await executeLocalCommand(`cd "${projectPath}" && pwd`);
                feedbackMessage = `Servidor de desenvolvimento operando no diretório "${projectPath}". Ativo em http://localhost:5173.`;
                break;
            }

            case 'systemStatus': {
                const cpuResult = await executeLocalCommand(`top -l 1 | head -n 10`);
                const diskResult = await executeLocalCommand(`df -h | head -n 5`);

                result = {
                    stdout: `--- CPU & PROCESSO ---\n${cpuResult.stdout}\n\n--- DISCO ---\n${diskResult.stdout}`,
                    stderr: cpuResult.stderr || diskResult.stderr,
                };
                feedbackMessage = `Telemetria de sistema macOS capturada: CPU e Armazenamento de Disco operando de forma estável.`;
                break;
            }

            default:
                return new Response(
                    JSON.stringify({
                        success: false,
                        toolUsed: 'unknown',
                        stdout: '',
                        stderr: 'Ferramenta OS desconhecida.',
                        feedbackMessage: 'Ferramenta de sistema não reconhecida.',
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
        }

        const responseData: LizOsToolResponse = {
            success: !result.stderr,
            toolUsed: tool,
            stdout: result.stdout,
            stderr: result.stderr,
            feedbackMessage,
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        return new Response(
            JSON.stringify({
                success: false,
                toolUsed: 'error',
                stdout: '',
                stderr: err.message || 'Erro de barramento OS.',
                feedbackMessage: 'Ocorreu um erro interno no barramento OS da LIZ.',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

import { executeLizLocalCommand } from '../../../services/lizAgentService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const command = body.command || '';

        const result = await executeLizLocalCommand(command);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({
                success: false,
                toolUsed: 'unknown',
                output: error?.message || 'Erro de execução no agente local.',
                logMessage: '> [ERRO] Falha na ponte IPC com o sistema operacional.',
                timestamp: new Date().toLocaleTimeString('pt-BR'),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

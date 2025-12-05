import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'settings.json');

const readSettings = () => {
    if (!fs.existsSync(SETTINGS_PATH)) {
        return {};
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
};

const writeSettings = (data: any) => {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
};

export async function GET() {
    const settings = readSettings();
    return NextResponse.json(settings);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const currentSettings = readSettings();
        const newSettings = { ...currentSettings, ...body };

        writeSettings(newSettings);

        return NextResponse.json(newSettings);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

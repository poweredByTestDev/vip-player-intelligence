
import "server-only";

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export function getData() {
  // Путь к папке с данными
  const dataFolder = path.join(process.cwd(), "data");

  // Читаем переписки
  const dialogsFile = fs.readFileSync(
    path.join(dataFolder, "dialogs.json"),
    "utf8"
  );

  // Читаем профили игроков
  const playersFile = fs.readFileSync(
    path.join(dataFolder, "players.csv"),
    "utf8"
  );

  // Преобразуем содержимое файлов в данные JavaScript
  const dialogs = JSON.parse(dialogsFile).dialogs;

  const players = parse(playersFile, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  // Соединяем игроков и переписки по ID
  const playersById = new Map(
    players.map((player) => [player.player_id, player])
  );

  const enrichedDialogs = dialogs.map((dialog) => ({
    ...dialog,
    player: playersById.get(dialog.player_id) ?? null,
  }));

  return {
    dialogs: enrichedDialogs,
    players,
  };
}

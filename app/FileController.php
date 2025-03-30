<?php

namespace App;

class FileController
{
	public function index()
	{
		return view('home');
	}

	private function list_directories($directory)
	{
		$items = is_dir($directory) ? $this->getDirectoryItems($directory) : [];
		$items = array_map(function ($item) {
			$paths = explode('/', $item['path']);
			$item['path'] = implode('/', array_slice($paths, 1));

			return $item;
		}, $items);

		return $items;
	}

	public function files()
	{
		$directory = 'storage';
		$path = request()->getInputHandler()->value('path', '');

		$subdir = $path;
		if ($subdir) {
			$directory .= '/' . $subdir;
		}

		$items = $this->list_directories($directory);

		return response()->json($items);
	}

	public function getDirectoryItems($directory)
	{
		$items = scandir($directory, SCANDIR_SORT_ASCENDING);

		$items = array_filter($items, function ($item) {
			return $item != '.' && $item != '..';
		});

		$items = array_map(function ($item) use ($directory) {
			$is_dir = is_dir($directory . '/' . $item);
			$extension = !$is_dir ? pathinfo($item, PATHINFO_EXTENSION) : null;

			$item = [
				'path' => $directory . '/' . $item,
				'name' => $item,
				'type' => $is_dir ? 'directory' : 'file',
				'extension' => $extension
			];

			return $item;
		}, $items);

		// make directories first
		$items = array_merge(array_filter($items, function ($item) {
			return $item['type'] == 'directory';
		}), array_filter($items, function ($item) {
			return $item['type'] == 'file';
		}));

		return array_values($items);
	}

	public function new_file()
	{
		$directory = 'storage';
		$path = request()->getInputHandler()->value('path', '');
		$filename = request()->getInputHandler()->value('filename', '');

		file_put_contents($directory . '/' . $path . '/' . $filename, '');

		return response()->json($this->list_directories($directory . '/' . $path));
	}

	public function rename_file()
	{
		$directory = 'storage';
		$path = request()->getInputHandler()->value('path', '');
		$filename = request()->getInputHandler()->value('filename', '');

		$dirname = dirname($directory . '/' . $path);

		rename(
			$directory . '/' . $path,
			$dirname . '/' . $filename
		);

		return response()->json($this->list_directories($dirname));
	}

	public function content()
	{
		$directory = 'storage';

		$path = $directory . '/' . request()->getInputHandler()->value('path', '');
		$contents = file_get_contents($path);

		return $contents;
	}

	public function save()
	{
		$directory = 'storage';

		$path = $directory . '/' . request()->getInputHandler()->value('path', '');
		$content = request()->getInputHandler()->value('content', '');
		$run = request()->getInputHandler()->value('run', '');

		file_put_contents($path, $content);

		if ($run) {
			try {
				$result = $this->run($path);
			} catch (\Exception $e) {
				$result = $e->getMessage();
			}

			return response()->json(['success' => true, 'result' => $result]);
		}

		return response()->json(['success' => true]);
	}

	public function run($path)
	{
		$extension = pathinfo($path, PATHINFO_EXTENSION);

		if ($extension == 'php') {
			ob_start();
			$result = include($path);
			$result = ob_get_contents();
			ob_end_clean();

			return $result;
		}

		if ($extension == 'js') {
			$path = realpath($path);
			// return $path;
			$result = shell_exec(sprintf('C:\Users\fuady\AppData\Local\fnm_multishells\24276_1743172052541\node "%s" 2>&1', $path));
			return $result;
		}
	}
}

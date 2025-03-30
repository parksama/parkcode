import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// import "ace-builds";
import AceEditor from 'react-ace';
import { get_mode_by_extension } from './modes';

window.get_mode_by_extension = get_mode_by_extension;

/** @type {typeof import("ace-builds")} */
const Ace = window.ace;

/**
 * @typedef {Object} FileObject
 * @property {string} name - The name of the file.
 * @property {string} extension - The file extension.
 * @property {string} path - The path to the file.
 * @property {string} type - The type of the file.
 * @property {FileObject[]?} children - The type of the file.
 * @property {boolean?} open - The type of the file.
 */

/**
 *
 * @param {FileObject[]} data
 * @param {string} targetPath
 * @param {FileObject[]} newChildren
 * @returns
 */
function insertChildren(data, targetPath, newChildren, open = true) {
	for (let item of data) {
		if (item.path === targetPath) {
			// set children
			item.children = newChildren;
			item.open = open;

			// stop search
			return true;
		}

		// if item has children, go deeper
		if (item.children) {
			const found = insertChildren(item.children, targetPath, newChildren, open);
			if (found) return true;
		}
	}

	return false;
}

const ParkCode = () => {
	const editor_ref = useRef(null);

	/** @type {[FileObject[], React.Dispatch<React.SetStateAction<FileObject[]>>]} */
	const [files, setFiles] = useState([]);

	const [sessions, setSessions] = useState([]);
	const [session, setSession] = useState(null);

	const get_files = () => {
		fetch('files')
			.then((response) => response.json())
			.then((data) => {
				setFiles(data);
			});
	};

	/**
	 *
	 * @param {FileObject} file
	 * @param {string} parentIndex
	 */
	const handleFileclick = (file, parentIndex) => {
		console.log(file);

		if (file.type == 'directory') {
			if (!file.children) {
				var param = new URLSearchParams();
				param.append('path', file.path);

				fetch('files' + '?' + param.toString())
					.then((response) => response.json())
					.then((children) => {
						setFiles((files) => {
							var newfiles = [...files];
							insertChildren(newfiles, file.path, children);
							return newfiles;
						});
					});
			} else {
				file.open = !file.open;
				setFiles((files) => {
					var newfiles = [...files];
					insertChildren(newfiles, file.path, file.children, file.open);
					return newfiles;
				});
			}
		}

		if (file.type == 'file') {
			const session_exist = sessions.find((session) => {
				return session.file.path == file.path;
			});

			if (session_exist) {
				setSession(session_exist);
			} else {
				var param = new URLSearchParams();
				param.append('path', file.path);

				fetch('content' + '?' + param.toString())
					.then((response) => response.text())
					.then((content) => {
						var mode = get_mode_by_extension('.' + file.extension);
						console.log({ mode, ext: file.extension });


						var newSession = Ace.createEditSession(content);
						newSession.file = file;

						if (mode) {
							newSession.setMode('ace/mode/' + mode);
						}

						setSessions((sessions) => {
							return [...sessions, newSession];
						});

						setSession(newSession);
					});
			}
		}
	};

	const handleFileSave = (run = false) => {
		/** @type {import('ace-builds').Editor} */
		var editor = editor_ref.current.editor;

		var session = editor.session;
		var content = session.getValue();

		if (session.file) {
			fetch('content', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					path: session.file.path,
					content: content,
					run: run
				}),
			})
				.then((response) => response.json())
				.then((data) => {
					console.log(data);

					if (run) {
						session.result = data.result;
						setSession(null);
						setTimeout(() => {
							setSession(session);
						}, 100);
					}
				});
		}
	};

	useEffect(() => {
		// console.log(editor_ref.current);
		window.myace = editor_ref.current;

		/** @type {import('ace-builds').Editor} */
		var editor = editor_ref.current.editor;

		// save command
		editor.commands.addCommand({
			name: 'save',
			bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
			exec: function (editor) {
				handleFileSave(false);
			}
		});

		// run command ctrl+enter
		editor.commands.addCommand({
			name: 'run',
			bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
			exec: function (editor) {
				handleFileSave(true);
			}
		});

		// ctrl+shift+p for openCommandPalette
		editor.commands.bindKey({
			win: 'Ctrl-Shift-P',
			mac: 'Command-Shift-P'
		}, 'openCommandPalette');
	}, [editor_ref]);

	useEffect(() => {
		/** @type {import('ace-builds').Editor} */
		var editor = editor_ref.current.editor;

		if (session) {
			editor.setSession(session);
		}
	}, [session]);

	useEffect(() => {
		if (session) {
			var session_exist = sessions.find((s) => {
				return s.file.path == session.file.path;
			});

			if (!session_exist) {
				if (sessions.length) {
					setSession(sessions[0]);
					console.log('current session not exist, switch to first available session');
				} else {
					setSession(null);
					/** @type {import('ace-builds').Editor} */
					var editor = editor_ref.current.editor;
					editor.setSession(Ace.createEditSession(''));
				}
			}
		}
	}, [session, sessions]);

	useEffect(() => {
		get_files();
	}, []);

	return (
		<div className="ParkCode">
			<div className="ParkCode__files">
				<div className="ParkCode__files__heading">
					Explorer
				</div>
				<FileTree files={files} onClick={handleFileclick} parentIndex="" session={session} />
			</div>
			<div className="ParkCode__content">
				<div className="ParkCode__content__tabs">
					<div className="ParkCode__content__tabs__inner">
						{sessions.map((sess, index) => {
							return (
								<div className={'ParkCode__content__tabs__item' + (sess === session ? ' active' : '')} key={index} onClick={() => {
									setSession(sess);
								}}>
									{sess.file.name}

									<div className="ParkCode__content__tabs__item__close" onClick={(e) => {
										e.stopPropagation();

										setSessions((sessions) => {
											return sessions.filter((session) => {
												return session !== sess;
											});
										});
									}}></div>
								</div>
							);
						})}
					</div>
				</div>
				<div className="ParkCode__content__editor" id="main-editor">
					<AceEditor
						ref={editor_ref}
						mode="php"
						theme="monokai"
						name="blah2"
						fontSize={16}
						showPrintMargin={false}
						showGutter={true}
						editorProps={{ $blockScrolling: true }}
						enableBasicAutocompletion
						enableLiveAutocompletion
						// value="<?php\n\n?>"
						width="100%"
						height="100%"
						readOnly={!session}
						placeholder={!session ? 'Select a file to open...' : ''}
					/>
				</div>
				{/* <div className="ParkCode__content__result">
					{session && session.result}
				</div> */}
				<div className="ParkCode__content__result hide-empty" dangerouslySetInnerHTML={{__html: session && session.result ? session.result : ''}} />
			</div>
		</div>
	);
};

/**
 * @typedef {Object} FileTreeProps
 * @property {FileObject[]} files
 * @property {string} parentIndex
 * @property {Function} onClick
 * @property {EditSession} session
 */

/**
 * @param {FileTreeProps} props
 * @returns
 */
const FileTree = ({ files, parentIndex, onClick, session }) => {
	if (!onClick) {
		onClick = () => { };
	}

	return (
		<ul data-parent-index={parentIndex}>
			{files.map((file, index) => {
				var icon = file.extension || 'default';

				if (file.type == 'directory') {
					icon = 'folder';
				}

				return (
					<li
						key={index}
						data-type={file.type}
						onClick={(e) => {
							e.stopPropagation();
							onClick(file, parentIndex + '/' + index);
						}}
						className={(session && session.file.path == file.path) ? 'active' : ''}
					>
						<div>
							<span className={'seti seti-' + icon}></span>
							{file.name}
						</div>

						{file.children && file.open && (
							<FileTree
								files={file.children}
								parentIndex={parentIndex + '/' + index}
								onClick={onClick}
								session={session}
							/>
						)}
					</li>
				);
			})}
		</ul>
	);
};

document.addEventListener('DOMContentLoaded', () => {
	const root = createRoot(document.querySelector('#ParkCode-root'));
	root.render(<ParkCode />);
});

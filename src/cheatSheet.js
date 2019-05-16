import React from 'react';


const CheatSheet = () => (
	<table className='cheatsheet'>
		<thead className='shortcut-headings'><tr><th className='shortcut-heading'>Key(s)</th><th className='shortcut-heading'>Action</th></tr></thead>
		<tbody>
			<tr><td className='shortcut-key cheatsheet-item'>;</td><td className='shortcut-action'>play/wind back</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>`</td><td className='shortcut-action'>stop</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⇥</td><td className='shortcut-action'>next low-confidence word</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⇧ + ⇥  </td><td className='shortcut-action'>previous low-confidence word</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>➡</td><td className='shortcut-action'>next word</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⬅</td><td className='shortcut-action'>previous word</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⇧+➡/⬅ </td><td className='shortcut-action'>select multiple words</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>^+;</td><td className='shortcut-action'>fast forward (or ⌘/❖+;)</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>^+’</td><td className='shortcut-action'>rewind 10 seconds (or ⌘/❖+’)</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>↵</td><td className='shortcut-action'>Edit and add words</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>^+z </td><td className='shortcut-action'>undo  (or ⌘/❖+z)</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>^+⇧+z</td><td className='shortcut-action'>redo (or ⌘/❖+⇧+z)</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⌫</td><td className='shortcut-action'>delete words </td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>, . : ? ! / “ ( ) [ ]</td><td className='shortcut-action'>add and remove punctuation on the fly.</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>^+`</td><td className='shortcut-action'>toggle capitalization</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⎵</td><td className='shortcut-action'>toggle word confident/unconfident</td></tr>
			<tr><td className='shortcut-key cheatsheet-item'>⇧+⎵ </td><td className='shortcut-action'>mark all words confident</td></tr>
		</tbody>
	</table>
);


export default Cheatsheet;

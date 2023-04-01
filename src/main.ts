import './style.css'

import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser, Slice } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'
import { exampleSetup } from 'prosemirror-example-setup'
import {
  ySyncPlugin,
  yDocToProsemirror,
  prosemirrorJSONToYDoc,
} from 'y-prosemirror'
import * as Y from 'yjs'

const JSON1 = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      content: [{ type: 'text', text: 'Hello world' }],
    },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
    },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }],
    },
    {
      type: 'blockquote',
      content: [
        { type: 'paragraph' },
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'C' }] },
          ],
        },
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'D' }] },
          ],
        },
      ],
    },
  ],
}

const JSON2 = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      content: [{ type: 'text', text: 'Hello world' }],
    },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
    },
    {
      type: 'blockquote',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'B' }] },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph' }],
        },
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'C' }] },
          ],
        },
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'D' }] },
          ],
        },
      ],
    },
  ],
}

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
})

const yjsDoc = prosemirrorJSONToYDoc(mySchema, JSON1)
const yjsType = yjsDoc.get('prosemirror', Y.XmlFragment) as Y.XmlFragment

const plugins = [...exampleSetup({ schema: mySchema }), ySyncPlugin(yjsType)]

const view = new EditorView(document.querySelector('#editor'), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(
      document.querySelector('#content')!
    ),
    plugins,
  }),
})

function getYjsString() {
  const pmDoc = yDocToProsemirror(mySchema, yjsDoc)
  return pmDoc.toString()
}

function getPmString() {
  return view.state.doc.toString()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handleButtonClick() {
  console.log('before yjs:', getYjsString())
  console.log('before pm: ', getPmString())
  await sleep(1000)

  const tr = view.state.tr
  const newContent = mySchema.nodeFromJSON(JSON2).content
  const newSlice = new Slice(newContent, 0, 0)
  tr.replace(0, tr.doc.content.size, newSlice)
  view.dispatch(tr)

  await sleep(1000)
  console.log('after yjs:', getYjsString())
  console.log('after pm: ', getPmString())
}

const button = document.getElementById('button-id')!

button.addEventListener('click', handleButtonClick)
;(window as any).view = view

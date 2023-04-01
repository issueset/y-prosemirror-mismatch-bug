import './style.css'

import { isEqual } from 'lodash-es'
import { exampleSetup } from 'prosemirror-example-setup'
import { DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { EditorState, Plugin } from 'prosemirror-state'
import { Step } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import {
  prosemirrorJSONToYDoc,
  yDocToProsemirror,
  ySyncPlugin,
} from 'y-prosemirror'

import * as Y from 'yjs'

const JSON1 = {
  type: 'doc',
  content: [
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
const mySchema = schema

const yjsDoc = prosemirrorJSONToYDoc(mySchema, JSON1)
const yjsType = yjsDoc.get('prosemirror', Y.XmlFragment) as Y.XmlFragment

const loggingPlugin = new Plugin({
  appendTransaction: (transactions, oldState, newState) => {
    console.log('transactions:', transactions.length)
    transactions.forEach((tr) => {
      console.log('steps:', tr.steps.length)
      tr.steps.forEach((step) => {
        console.log(JSON.stringify(step.toJSON()))
      })
    })
    return null
  },
})

const plugins = [
  ...exampleSetup({ schema: mySchema }),
  ySyncPlugin(yjsType),
  loggingPlugin,
]

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

function logState(prefix: string) {
  console.log(`${prefix} yjs:`, getYjsString())
  console.log(`${prefix} pm: `, getPmString())
}

async function handleButtonClick() {
  await sleep(1000)

  const tr = view.state.tr

  const currJSON = view.state.doc.toJSON()

  if (isEqual(currJSON, JSON1)) {
    const step1JSON =
      '{"stepType":"replaceAround","from":11,"to":13,"gapFrom":11,"gapTo":13,"insert":1,"slice":{"content":[{"type":"blockquote"}]},"structure":true}'
    const step2JSON = '{"stepType":"replace","from":9,"to":11,"structure":true}'
    const step1 = Step.fromJSON(mySchema, JSON.parse(step1JSON))
    const step2 = Step.fromJSON(mySchema, JSON.parse(step2JSON))
    tr.step(step1)
    tr.step(step2)
  } else if (isEqual(currJSON, JSON2)) {
    const step1JSON =
      '{"stepType":"replaceAround","from":12,"to":23,"gapFrom":13,"gapTo":23,"insert":0,"slice":{"content":[{"type":"blockquote"}],"openStart":1},"structure":true}'
    const step2JSON =
      '{"stepType":"replaceAround","from":9,"to":24,"gapFrom":9,"gapTo":23,"insert":1,"slice":{"content":[{"type":"blockquote"}],"openStart":1},"structure":true}'
    const step1 = Step.fromJSON(mySchema, JSON.parse(step1JSON))
    const step2 = Step.fromJSON(mySchema, JSON.parse(step2JSON))
    tr.step(step1)
    tr.step(step2)
  } else {
    console.error("can't handle this case. Please restart the editor")
  }
  view.dispatch(tr)
  await sleep(2000)

  logState('after')
}

const button = document.getElementById('button-id')!

button.addEventListener('click', handleButtonClick)
button.addEventListener('mousedown', (event) => {
  event.preventDefault()
})
;(window as any).view = view

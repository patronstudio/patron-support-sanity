import { useState, useMemo } from 'react'
import { useColorSchemeValue, definePlugin } from 'sanity'
import {
  Box,
  Stack,
  Heading,
  Flex,
  Text,
  Grid,
  LabelSkeleton,
  useToast
} from '@sanity/ui'
import { ClockIcon, OlistIcon, AddCircleIcon } from '@sanity/icons'
import { SlSupport as icon } from 'react-icons/sl'
import Airtable from 'airtable'

import {
  PluginConfig,
  ClickUpIssueTypes,
  AirtableSupportTeam,
  AirtableClientData,
  TicketStatus
} from './types'

import SupportDetails from './support-details'
import SupportForm from './support-form'

import s from './styles.module.css'

const AIRTABLE_SUPPORT_FIELD_IDS = {
  ADMIN_ID: 'fld0Tmj0DLOLKYKV4',
  NAME: 'fldw1wh4tOM4duJ0a',
  EMAIL: 'fldL05Ry6XYQnnCim',
  ROLES: 'fldy8kC0xMouYAb4n',
  PROFILE_IMAGE: 'fldTXhL0MUH3KN5ul',
  COLOUR: 'fldmHUIQaJu5xksfB'
}
const { ADMIN_ID, NAME, EMAIL, ROLES, PROFILE_IMAGE, COLOUR } =
  AIRTABLE_SUPPORT_FIELD_IDS
const AIRTABLE_CLIENT_FIELD_IDS = {
  SLACK_SUPPORT: 'fldEnfZzl8oRddaSv',
  EMAIL_SUPPORT: 'fldmOz74cubhi5rFK',
  PHONE_SUPPORT: 'fldJaq1LEaWLw1jad',
  ACCOUNT_MANAGER_NAME: 'fldE5ClGpPG9tde8m',
  ACCOUNT_MANAGER_EMAIL: 'fldXhBVN4pOTokO2Q',
  TARGET_RESPONSE_TIME: 'fldonQJxmJB6pToFv',
  TARGET_RESOLUTION_TIME: 'fld9EMjok8ZtOV6H5',
  SUPPORT_TEAM_IDS: 'fldl3l5Ewc96Sa8CC'
}
const {
  SLACK_SUPPORT,
  EMAIL_SUPPORT,
  PHONE_SUPPORT,
  ACCOUNT_MANAGER_NAME,
  ACCOUNT_MANAGER_EMAIL,
  TARGET_RESPONSE_TIME,
  TARGET_RESOLUTION_TIME,
  SUPPORT_TEAM_IDS
} = AIRTABLE_CLIENT_FIELD_IDS

const PATRON_API_URL = 'https://patron.studio/api'

const Support = (props: {
  tool: {
    options: PluginConfig
  }
}) => {
  const { airtableApiKey, airtableBaseId } = props.tool.options
  const AIRTABLE_CLIENT_CONFIG = props.tool.options.config
  const base = new Airtable({
    apiKey: airtableApiKey
  }).base(airtableBaseId)
  const toast = useToast()
  const scheme = useColorSchemeValue()
  const [supportTeam, setSupportTeam] =
    useState<Array<AirtableSupportTeam> | null>([])
  const [supportData, setSupportData] = useState<AirtableClientData>({
    slackSupport: '',
    emailSupport: '',
    phoneSupport: '',
    accountManager: '',
    accountManagerEmail: [],
    targetResponseTime: '',
    targetResolutionTime: '',
    supportTeamIds: [],
    supportTeam: []
  })
  const [tickets, setTickets] = useState<TicketStatus>()
  const [issueTypes, setIssueTypes] = useState<Array<ClickUpIssueTypes>>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [refreshData, setRefreshData] = useState<boolean>(false)

  // Set support team data from Airtable
  useMemo(() => {
    base(AIRTABLE_CLIENT_CONFIG.supportTableId)
      .select({
        fields: [
          ...Object.keys(AIRTABLE_SUPPORT_FIELD_IDS).map(
            (key) => AIRTABLE_SUPPORT_FIELD_IDS[key]
          )
        ],
        returnFieldsByFieldId: true
      })
      .eachPage(
        function page(records) {
          records.forEach(function (record) {
            const getProfileImage = record.get(PROFILE_IMAGE)
            setSupportTeam((prev) => [
              ...prev,
              {
                id: record.get(ADMIN_ID),
                name: record.get(NAME),
                email: record.get(EMAIL),
                roles: record.get(ROLES),
                colour: record.get(COLOUR),
                ...(getProfileImage?.[0].url && {
                  profileImage: getProfileImage[0].url
                })
              } as AirtableSupportTeam
            ])
            setIsLoading(false)
          })
        },
        function done(error) {
          if (error) {
            toast.push({
              status: 'error',
              title: error.message
            })
            setIsLoading(false)
            return
          }
        }
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set client data from Airtable
  useMemo(() => {
    if (!supportTeam.length) return

    base(AIRTABLE_CLIENT_CONFIG.clientsTableId)
      .select({
        maxRecords: 1,
        filterByFormula: `{Record ID} = '${AIRTABLE_CLIENT_CONFIG.clientId}'`,
        fields: [
          ...Object.keys(AIRTABLE_CLIENT_FIELD_IDS).map(
            (key) => AIRTABLE_CLIENT_FIELD_IDS[key]
          )
        ],
        returnFieldsByFieldId: true
      })
      .eachPage(
        function page(records) {
          records.forEach(function (record) {
            const supportTeamIds = record.get(SUPPORT_TEAM_IDS) as Array<string>
            setSupportData({
              slackSupport: record.get(SLACK_SUPPORT),
              emailSupport: record.get(EMAIL_SUPPORT),
              phoneSupport: record.get(PHONE_SUPPORT),
              accountManager: record.get(ACCOUNT_MANAGER_NAME),
              accountManagerEmail: record.get(ACCOUNT_MANAGER_EMAIL),
              targetResponseTime: record.get(TARGET_RESPONSE_TIME),
              targetResolutionTime: record.get(TARGET_RESOLUTION_TIME),
              ...(supportTeamIds.length > 0 &&
                supportTeam.length > 0 && {
                  supportTeam: supportTeam.filter(({ id }) =>
                    supportTeamIds.includes(id)
                  )
                })
            } as AirtableClientData)
            setIsLoading(false)
          })
        },
        function done(error) {
          if (error) {
            console.error(error)
            toast.push({
              status: 'error',
              title: error.message
            })
            setIsLoading(false)
            return
          }
        }
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportTeam])

  // Set ticket and issue type data from ClickUp
  useMemo(() => {
    const fetchClickUpData = async () => {
      try {
        const resp = await fetch(`${PATRON_API_URL}/patron-support-details`)

        if (!resp) {
          toast.push({
            status: 'error',
            title: 'Error fetching ClickUp data'
          })
        }

        const data: {
          tickets: TicketStatus
          issueTypes: Array<ClickUpIssueTypes>
        } = await resp.json()

        if (!data) {
          toast.push({
            status: 'error',
            title: 'Error fetching ClickUp data'
          })
        }

        if (data?.tickets) {
          setTickets(data.tickets)
        }

        if (data?.issueTypes?.length > 0) {
          setIssueTypes(data.issueTypes)
        }
      } catch (error) {
        toast.push({
          status: 'error',
          title: 'Error',
          description: error.message
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClickUpData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshData])

  const handleScrollToElement = (element: HTMLElement) => {
    if (!element) return

    return window.scrollTo({
      top: element.offsetTop - 120,
      behavior: 'smooth'
    })
  }

  const {
    targetResponseTime,
    targetResolutionTime,
    accountManager,
    accountManagerEmail
  } = supportData

  return (
    <Box>
      <Box className={s.nav}>
        <Flex
          direction={['row', 'row', 'row', 'row-reverse']}
          justify="space-between"
          align="center"
          paddingTop={scheme === 'dark' ? [4, 4, 4, 2] : 0}
          paddingBottom={[4, 4, 4, 2]}
        >
          <svg
            className={s.logoMobile}
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
            viewBox="0 0 100 36"
          >
            <path d="M97.071 7.332a8.115 8.115 0 0 0-5.436-2.128c-1.806 0-3.375.508-4.665 1.51v-.862a.4.4 0 0 0-.398-.4h-2.249a.4.4 0 0 0-.4.4V22.89a.4.4 0 0 0 .4.401h2.249a.4.4 0 0 0 .398-.4V12.753c0-3.049 1.526-4.53 4.665-4.53 1.443 0 2.525.298 3.308.91.947.742 1.427 1.96 1.427 3.62V22.89a.4.4 0 0 0 .4.401h2.248a.4.4 0 0 0 .399-.4V12.505c0-1.943-.833-3.78-2.346-5.174" />
            <path d="M72.678 20.485c-3.43 0-6.117-2.693-6.117-6.13 0-1.648.629-3.184 1.772-4.325 1.145-1.143 2.688-1.772 4.345-1.772 1.642 0 3.174.629 4.314 1.772a6.073 6.073 0 0 1 1.768 4.324c0 3.438-2.672 6.131-6.082 6.131m0-15.28c-2.47 0-4.786.95-6.519 2.678a9.073 9.073 0 0 0-2.682 6.471c0 2.48.953 4.8 2.682 6.534s4.045 2.688 6.519 2.688a9.035 9.035 0 0 0 6.457-2.688c1.724-1.737 2.673-4.058 2.673-6.534 0-2.445-.95-4.743-2.673-6.47a9.06 9.06 0 0 0-6.457-2.68" />
            <path d="M62.037 5.204h-.682c-3.151.105-4.104.64-5.267 1.511v-.863a.4.4 0 0 0-.399-.4h-2.248a.4.4 0 0 0-.4.4V22.89c0 .221.18.401.4.401h2.248a.4.4 0 0 0 .4-.4V12.753c0-2.945 1.774-4.374 5.585-4.496h.363a.4.4 0 0 0 .399-.4V5.604a.4.4 0 0 0-.4-.4" />
            <path d="M50.528 5.452h-4.707V.4a.4.4 0 0 0-.4-.4h-2.247a.4.4 0 0 0-.4.4v5.052h-4.742a.4.4 0 0 0-.4.4v2.005c0 .221.18.4.4.4h4.742v14.634c0 .22.18.4.4.4h2.248a.4.4 0 0 0 .399-.4V8.258h4.707a.4.4 0 0 0 .4-.4V5.852a.4.4 0 0 0-.4-.4" />
            <path d="M32.469 14.36c-.002 3.432-2.672 6.123-6.077 6.125h-.004a6.065 6.065 0 0 1-4.315-1.805 6.09 6.09 0 0 1-1.803-4.328c.001-3.414 2.685-6.09 6.11-6.094h.007a6.03 6.03 0 0 1 4.293 1.79 6.06 6.06 0 0 1 1.789 4.311m2.649-8.907h-2.25a.4.4 0 0 0-.4.4V7.53a9.636 9.636 0 0 0-2.76-1.699 8.974 8.974 0 0 0-3.321-.627 9.204 9.204 0 0 0-7.037 3.24 9.039 9.039 0 0 0-1.813 3.39 9.269 9.269 0 0 0-.225 4.062 9.233 9.233 0 0 0 3.106 5.554 8.917 8.917 0 0 0 5.96 2.124c2.219-.043 4.436-.89 6.09-2.324v1.64a.4.4 0 0 0 .4.401h2.25a.4.4 0 0 0 .399-.4V5.851a.4.4 0 0 0-.4-.4" />
            <path d="M13.603 8.158a4.64 4.64 0 0 1-.39 1.511 4.645 4.645 0 0 1-1.59 1.9c-.764.525-1.697.803-2.7.803H3.99V3.18h5.147a4.523 4.523 0 0 1 2.146.596c.212.121.402.271.576.415.35.288.746.644 1.024 1.09.292.466.49.923.606 1.395.118.479.156.977.114 1.481m2.642-3.717a7.827 7.827 0 0 0-2.202-2.761 7.765 7.765 0 0 0-1.495-.936 7.286 7.286 0 0 0-1.74-.58 8.734 8.734 0 0 0-1.67-.158L4.87.008H1.017a.4.4 0 0 0-.4.4v22.474c0 .22.18.4.4.4h2.574a.4.4 0 0 0 .4-.4v-7.346h4.646c.895 0 1.773-.02 2.672-.27a7.691 7.691 0 0 0 2.168-.985 7.783 7.783 0 0 0 2.045-1.957 7.789 7.789 0 0 0 1.273-2.795 7.882 7.882 0 0 0 .036-3.35 7.658 7.658 0 0 0-.586-1.738" />
            <path d="M3.048 35.13c1.43 0 2.3-.99 2.3-2.06 0-.98-.7-1.58-1.87-1.89l-.9-.24c-.92-.24-1-.72-1-.96 0-.68.64-1.14 1.33-1.14.74 0 1.31.47 1.31 1.16h.9c0-1.23-.97-2-2.18-2-1.2 0-2.27.8-2.27 1.99 0 .56.23 1.42 1.69 1.77l.89.22c.58.15 1.19.45 1.19 1.12 0 .61-.5 1.19-1.39 1.19-.92 0-1.5-.62-1.53-1.23h-.9c.01 1.07.98 2.07 2.43 2.07zm6.643 0c1.36 0 2.51-.9 2.51-2.47v-4.54h-.91v4.54c0 1.09-.74 1.6-1.6 1.6-.86 0-1.6-.51-1.6-1.6v-4.54h-.91v4.54c0 1.57 1.15 2.47 2.51 2.47zm4.847-7.01v6.89h.91v-2.59h1.83c1.46 0 2.05-1.06 2.05-2.15 0-1.07-.59-2.15-2.05-2.15zm.91 3.45v-2.61h1.82c.82 0 1.15.67 1.15 1.31 0 .66-.34 1.3-1.2 1.3zm5.694-3.45v6.89h.91v-2.59h1.83c1.46 0 2.05-1.06 2.05-2.15 0-1.07-.59-2.15-2.05-2.15zm.91 3.45v-2.61h1.82c.82 0 1.15.67 1.15 1.31 0 .66-.34 1.3-1.2 1.3zm8.693 3.56c1.97 0 3.5-1.6 3.5-3.55 0-1.96-1.53-3.58-3.5-3.58-1.96 0-3.48 1.62-3.48 3.58 0 1.95 1.52 3.55 3.48 3.55zm0-.84c-1.45 0-2.57-1.24-2.57-2.71 0-1.48 1.12-2.74 2.57-2.74 1.47 0 2.59 1.26 2.59 2.74 0 1.47-1.12 2.71-2.59 2.71zm10.15.72-1.83-2.59c1.23-.09 1.8-1.15 1.8-2.15 0-1.07-.58-2.15-2.08-2.15h-2.59v6.89h.91v-2.6h.89l1.81 2.6zm-2.09-6.05c.7 0 1.15.54 1.15 1.31 0 .78-.4 1.31-1.41 1.31h-1.44v-2.62zm3.204-.84v.84h2.1v6.05h.91v-6.05h2.1v-.84z" />
          </svg>
          <svg
            className={s.logoDesktop}
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
            viewBox="0 0 133 46"
          >
            <path d="M129.222 9.776a10.82 10.82 0 0 0-7.248-2.837c-2.408 0-4.5.677-6.219 2.013V7.803a.534.534 0 0 0-.532-.534h-2.998a.534.534 0 0 0-.533.534v22.718c0 .294.239.534.533.534h2.998c.293 0 .532-.24.532-.534V17.005c0-4.064 2.034-6.04 6.219-6.04 1.923 0 3.367.397 4.411 1.215 1.262.988 1.903 2.612 1.903 4.825v13.516c0 .294.238.534.532.534h2.997c.294 0 .533-.24.533-.534V16.675c0-2.59-1.111-5.041-3.128-6.9Z" />
            <path d="M96.698 27.314c-4.574 0-8.156-3.59-8.156-8.175 0-2.196.839-4.244 2.363-5.765 1.526-1.525 3.584-2.364 5.793-2.364 2.19 0 4.232.84 5.752 2.364 1.52 1.524 2.357 3.571 2.357 5.765 0 4.584-3.562 8.175-8.11 8.175Zm0-20.375c-3.294 0-6.38 1.268-8.692 3.572a12.098 12.098 0 0 0-3.576 8.628c0 3.306 1.27 6.4 3.576 8.711s5.393 3.585 8.692 3.585c3.258 0 6.315-1.273 8.609-3.585 2.298-2.315 3.564-5.41 3.564-8.71a12.14 12.14 0 0 0-3.564-8.629 12.081 12.081 0 0 0-8.61-3.572Z" />
            <path d="M82.51 6.939h-.91c-4.202.14-5.472.854-7.023 2.015v-1.15a.534.534 0 0 0-.532-.535H71.05a.534.534 0 0 0-.533.534v22.718c0 .294.239.534.533.534h2.997c.293 0 .532-.24.532-.534V17.005c0-3.926 2.367-5.831 7.448-5.995h.484c.293 0 .532-.24.532-.533V7.473a.533.533 0 0 0-.532-.534Z" />
            <path d="M67.165 7.27H60.89V.532A.533.533 0 0 0 60.357 0h-2.998a.533.533 0 0 0-.532.533V7.27h-6.323a.534.534 0 0 0-.532.534v2.674c0 .294.239.533.532.533h6.323v19.51c0 .295.239.534.532.534h2.998a.533.533 0 0 0 .532-.533V11.01h6.276c.294 0 .533-.24.533-.534V7.803a.534.534 0 0 0-.533-.534Z" />
            <path d="M43.086 19.146c-.003 4.576-3.562 8.164-8.103 8.168h-.005c-2.16 0-4.204-.855-5.754-2.408-1.55-1.553-2.405-3.603-2.404-5.77.002-4.551 3.58-8.12 8.147-8.125h.01a8.04 8.04 0 0 1 5.724 2.387 8.08 8.08 0 0 1 2.385 5.748Zm3.532-11.877h-3a.534.534 0 0 0-.532.534v2.237a12.848 12.848 0 0 0-3.68-2.265c-1.4-.555-2.89-.836-4.43-.836a12.273 12.273 0 0 0-9.382 4.32 12.052 12.052 0 0 0-2.418 4.521c-.499 1.747-.6 3.57-.3 5.414.472 2.903 1.943 5.533 4.142 7.406a11.89 11.89 0 0 0 7.947 2.832c2.958-.057 5.914-1.186 8.12-3.098v2.187c0 .294.24.534.534.534h2.999c.293 0 .532-.24.532-.534V7.803a.534.534 0 0 0-.532-.534Z" />
            <path d="M17.93 10.878a6.19 6.19 0 0 1-.518 2.015 6.195 6.195 0 0 1-2.12 2.531c-1.019.701-2.263 1.072-3.6 1.072H5.115V4.24h6.862a6.03 6.03 0 0 1 2.86.795c.283.162.536.361.768.553.468.385.996.86 1.367 1.453.389.622.653 1.232.808 1.861.157.638.208 1.303.15 1.975Zm3.524-4.957a10.44 10.44 0 0 0-2.935-3.68c-.614-.49-1.285-.91-1.995-1.249a9.714 9.714 0 0 0-2.32-.774c-.713-.14-1.462-.21-2.226-.21L6.289.011H1.15a.534.534 0 0 0-.532.534V30.51c0 .294.238.533.532.533h3.432c.294 0 .533-.24.533-.533v-9.794h6.195c1.194 0 2.364-.027 3.563-.361a10.255 10.255 0 0 0 2.89-1.312 10.38 10.38 0 0 0 2.727-2.61 10.387 10.387 0 0 0 1.698-3.727c.336-1.46.353-3.004.048-4.467-.167-.8-.43-1.58-.782-2.317Z" />
            <path d="M68.328 42.972c0 1.512 1.414 2.926 3.374 2.926 1.904 0 3.038-1.12 3.22-2.52.21-1.554-.77-2.562-2.576-3.024l-1.26-.308c-1.218-.294-1.372-.924-1.372-1.344 0-.882.854-1.456 1.806-1.456 1.064 0 1.82.616 1.82 1.582h1.302c0-1.736-1.358-2.828-3.108-2.828-1.638 0-3.122 1.092-3.122 2.716 0 .84.294 2.002 2.352 2.52l1.246.308c.868.196 1.708.686 1.638 1.722-.112.728-.714 1.414-1.946 1.414-1.218 0-2.072-.868-2.072-1.708h-1.302Zm12.543 1.666c-1.19 0-2.212-.854-2.212-2.198v-6.328h-1.316v6.328c0 2.1 1.61 3.458 3.528 3.458 1.89 0 3.528-1.358 3.528-3.458v-6.328h-1.316v6.328c0 1.344-1.022 2.198-2.212 2.198Zm6.559-8.526v9.646h1.315v-3.612h2.534c2.044 0 2.87-1.498 2.87-3.01 0-1.512-.826-3.024-2.87-3.024h-3.85Zm3.835 1.218c1.12 0 1.582.924 1.582 1.806 0 .896-.476 1.792-1.652 1.792h-2.45V37.33h2.52Zm5.155-1.218v9.646h1.316v-3.612h2.534c2.044 0 2.87-1.498 2.87-3.01 0-1.512-.826-3.024-2.87-3.024h-3.85Zm3.836 1.218c1.12 0 1.582.924 1.582 1.806 0 .896-.476 1.792-1.652 1.792h-2.45V37.33h2.52Zm4.524 3.626c0 2.744 2.128 4.942 4.872 4.942 2.758 0 4.9-2.198 4.9-4.942 0-2.73-2.142-4.956-4.9-4.956-2.744 0-4.872 2.226-4.872 4.956Zm1.302 0c0-2.058 1.554-3.696 3.57-3.696 2.03 0 3.584 1.638 3.584 3.696 0 2.058-1.554 3.682-3.584 3.682-2.016 0-3.57-1.624-3.57-3.682Zm15.016 1.148c1.806-.154 2.52-1.54 2.52-2.968 0-1.512-.826-3.024-2.856-3.024h-3.71v9.646h1.316v-3.612h1.232l2.492 3.612h1.582l-2.576-3.654Zm-.378-4.774c1.12 0 1.554.924 1.554 1.806 0 .896-.434 1.792-1.61 1.792h-2.296V37.33h2.352Zm4.494-1.218v1.232h2.926v8.414h1.316v-8.414h2.926v-1.232h-7.168Z" />
          </svg>
          <Flex>
            <button
              type="button"
              className={s.navBtn}
              onClick={() =>
                handleScrollToElement(
                  document.getElementById('scroll-to-support-request')
                )
              }
            >
              <AddCircleIcon />
              <span>Support Request</span>
            </button>
            <button
              type="button"
              className={s.navBtn}
              onClick={() =>
                handleScrollToElement(
                  document.getElementById('scroll-to-your-plan')
                )
              }
            >
              <OlistIcon />
              <span>Your Plan</span>
            </button>
          </Flex>
        </Flex>
      </Box>
      <SupportForm
        patronApiUrl={PATRON_API_URL}
        tickets={tickets}
        issueTypes={issueTypes}
        isDataLoading={isLoading}
        setRefreshData={setRefreshData}
      />
      <SupportDetails data={supportData} isDataLoading={isLoading} />
      <Box
        id="scroll-to-your-plan"
        paddingX={[4, 4, 4, 5]}
        paddingY={[5, 5, 5, 6]}
        style={{
          backgroundColor: '#F2F2F2',
          borderTop: '1px solid #3f434a',
          borderBottom: '1px solid #3f434a'
        }}
      >
        <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Stack space={[5, 5, 5, 6]} paddingX={[4, 4, 4, 6]}>
            {isLoading ? (
              <LabelSkeleton radius={1} animated />
            ) : (
              <Heading size={[2, 2, 2, 4]} style={{ color: '#101112' }}>
                Your Scale & Support Plan
              </Heading>
            )}
            <Stack
              space={5}
              padding={4}
              style={{ borderRadius: '8px', backgroundColor: '#fff' }}
            >
              <Grid columns={[1, 1, 1, 2]} gap={[5, 5, 5, 8]}>
                {isLoading ? (
                  <>
                    <LabelSkeleton radius={1} animated />
                    <LabelSkeleton radius={1} animated />
                  </>
                ) : (
                  <>
                    <Flex justify="space-between" align="center">
                      <Flex align="center">
                        <ClockIcon className={s.responseIcon} />
                        <Text
                          size={[2, 2, 2, 3]}
                          weight="semibold"
                          style={{ color: '#3F434A' }}
                        >
                          Target Response Time
                        </Text>
                      </Flex>
                      <Text
                        size={[2, 2, 2, 3]}
                        weight="semibold"
                        style={{ color: '#3F434A' }}
                      >
                        {targetResponseTime || '-'} hours
                      </Text>
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <Flex align="center">
                        <ClockIcon className={s.responseIcon} />
                        <Text
                          size={[2, 2, 2, 3]}
                          weight="semibold"
                          style={{ color: '#3F434A' }}
                        >
                          Target Resolution Time
                        </Text>
                      </Flex>
                      <Text
                        size={[2, 2, 2, 3]}
                        weight="semibold"
                        style={{ color: '#3F434A' }}
                      >
                        {targetResolutionTime || '-'} days
                      </Text>
                    </Flex>
                  </>
                )}
              </Grid>
            </Stack>
            <div className={s.supportText}>
              {isLoading ? (
                <Flex justify="space-between" style={{ width: '50%' }}>
                  <LabelSkeleton radius={1} animated style={{ width: '70%' }} />
                  <LabelSkeleton radius={1} animated style={{ width: '20%' }} />
                </Flex>
              ) : (
                <>
                  {accountManager && accountManagerEmail.length > 0 && (
                    <a
                      href={`mailto:${accountManagerEmail}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <Text
                        size={[2, 2, 2, 3]}
                        weight="semibold"
                        style={{ color: '#3F434A' }}
                      >
                        Looking for a new feature for your team? Arrange a call
                        with your account manager{' '}
                        <b>
                          <u>{accountManager}</u>
                        </b>
                        .
                      </Text>
                    </a>
                  )}
                </>
              )}
            </div>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

const patronSupportTool = (options: PluginConfig) => ({
  name: 'patron-support-tool',
  title: 'Support',
  component: Support,
  icon,
  options
})

export const patronSupport = definePlugin((options: PluginConfig) => {
  return { name: 'patron-support', tools: [patronSupportTool(options)] }
})
